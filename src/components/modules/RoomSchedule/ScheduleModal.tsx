import { IRoom } from "@/@types/Room";
import roomApis from "@/apis/room.apis";
import roomsScheduleApis, {
  ICreateRoomScheduleRequest,
} from "@/apis/roomSchedule.api";
import fnbOrderApis from "@/apis/fnbOrder.apis";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoomStatus, RoomType } from "@/constants/enum";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { roomTypeOptions } from "@/pages/RoomsManagement/constants";

const PEOPLE_COUNT_LARGE_THRESHOLD = 5;

const getRoomTypeForBooking = (use4Mic: boolean): RoomType.Medium | RoomType.Large =>
  use4Mic ? RoomType.Large : RoomType.Medium;

const getRoomTypeLabel = (type?: RoomType) => {
  switch (type) {
    case RoomType.Large:
      return "Lớn";
    case RoomType.Medium:
      return "Vừa";
    case RoomType.Dorm:
      return "Dorm";
    default:
      return "—";
  }
};

// Define schema using zod
const buildScheduleSchema = (requirePeopleCount: boolean) =>
  z.object({
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    status: z.nativeEnum(RoomStatus),
    roomType: z.nativeEnum(RoomType).optional(),
    peopleCount: requirePeopleCount
      ? z.coerce
          .number({
            required_error: "Vui lòng nhập số lượng người",
            invalid_type_error: "Số người phải là số hợp lệ",
          })
          .int("Số người phải là số nguyên")
          .min(1, "Số người phải ít nhất 1")
      : z.coerce.number().optional(),
    note: z.string().max(200).optional(),
    giftEnabled: z.boolean().optional(),
    use4Mic: z.boolean().optional(),
  });

type FormValues = z.infer<ReturnType<typeof buildScheduleSchema>>;

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  refetchSchedules: () => void;
  // Nếu có scheduleId thì chế độ cập nhật; nếu không là chế độ tạo mới
  scheduleId?: string;
  // Khi tạo mới, cần cung cấp thông tin phòng
  room?: IRoom;
  // Ngày được chọn từ component cha
  selectedDate?: Date;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  refetchSchedules,
  scheduleId,
  room,
  selectedDate = new Date(),
}) => {
  const requirePeopleCount =
    !scheduleId && !!room && room.roomType !== RoomType.Dorm;
  const scheduleSchema = useMemo(
    () => buildScheduleSchema(requirePeopleCount),
    [requirePeopleCount],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      status: RoomStatus.Booked,
      note: "",
      giftEnabled: false,
      peopleCount: undefined,
      use4Mic: false,
    },
  });

  const { control, handleSubmit, setValue, watch } = form;
  const startDateValue = watch("startDate");
  const startTimeValue = watch("startTime");
  const statusValue = watch("status");
  const peopleCountValue = watch("peopleCount");
  const use4MicValue = watch("use4Mic");
  const parsedPeopleCount =
    typeof peopleCountValue === "number"
      ? peopleCountValue
      : Math.max(1, Number(peopleCountValue) || 0);
  const suggestedRoomType =
    peopleCountValue !== undefined &&
    !Number.isNaN(Number(peopleCountValue)) &&
    parsedPeopleCount >= 1
      ? getRoomTypeForBooking(!!use4MicValue)
      : null;
  const willChangeRoomType =
    !!room &&
    room.roomType !== RoomType.Dorm &&
    !!suggestedRoomType &&
    suggestedRoomType !== room.roomType;

  // Biến cờ để đánh dấu nếu người dùng đã tự chỉnh sửa End Time
  const [isEndTimeModified, setIsEndTimeModified] = useState(false);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Load schedule khi mở modal chỉnh sửa (scheduleId có giá trị)
  const { data: scheduleData } = useQuery({
    queryKey: ["roomSchedule", scheduleId],
    queryFn: () => roomsScheduleApis.getScheduleById(scheduleId!),
    enabled: isOpen && !!scheduleId,
  });

  const schedule = scheduleData?.data?.result;

  useEffect(() => {
    if (scheduleId && schedule && isOpen) {
      const start = dayjs(schedule.startTime);
      const end = schedule.endTime
        ? dayjs(schedule.endTime)
        : start.add(2, "hour");
      setValue("startDate", start.format("YYYY-MM-DD"));
      setValue("endDate", end.format("YYYY-MM-DD"));
      setValue("startTime", start.format("HH:mm"));
      setValue("endTime", end.format("HH:mm"));
      setValue("status", schedule.status as RoomStatus);
      setValue("note", schedule.note ?? "");
      setValue("giftEnabled", schedule.giftEnabled ?? false);
      setIsEndTimeModified(true); // Giữ nguyên end từ schedule, không tự động tính lại
    }
  }, [scheduleId, schedule, isOpen, setValue]);

  const { mutate: updateSchedule, isPending: isUpdating } = useMutation({
    mutationFn: (payload: {
      id: string;
      schedule: Partial<ICreateRoomScheduleRequest>;
    }) => roomsScheduleApis.updateSchedule(payload.id, payload.schedule),
    onSuccess: () => {
      refetchSchedules();
      onClose();
    },
    onError: (error) => {
      console.error("Error updating schedule:", error);
    },
  });

  const { mutateAsync: updateRoom, isPending: isUpdatingRoom } = useMutation({
    mutationFn: (updatedRoom: IRoom) => roomApis.updateRoom(updatedRoom),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (error) => {
      console.error("Error updating room type:", error);
    },
  });

  const { mutateAsync: createSchedule, isPending: isCreating } = useMutation({
    mutationFn: (payload: ICreateRoomScheduleRequest) =>
      roomsScheduleApis.createSchedule(payload),
    onSuccess: async (response) => {
      // response.data.result là roomSchedule vừa tạo
      const roomScheduleId = response?.data?.result;
      console.log("roomScheduleId", roomScheduleId);

      if (roomScheduleId) {
        try {
          await fnbOrderApis.createFnbOrder({
            roomScheduleId,
            order: { drinks: {}, snacks: {} },
            createdBy: user?.name || "system",
          });
        } catch (err) {
          console.error("Tạo order thất bại:", err);
        }
      }
      refetchSchedules();
      onClose();
    },
    onError: (error) => {
      console.error("Error creating schedule:", error);
    },
  });

  // Dùng ref để đảm bảo khởi tạo giá trị mặc định chỉ chạy 1 lần
  const isInitialized = useRef(false);
  const prevPeopleCountRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!scheduleId && room && isOpen) {
      setValue("roomType", room.roomType);
      setValue("peopleCount", undefined);
      setValue("use4Mic", false);
      prevPeopleCountRef.current = undefined;
    }
  }, [scheduleId, room, isOpen, setValue]);

  useEffect(() => {
    if (
      peopleCountValue === undefined ||
      Number.isNaN(Number(peopleCountValue))
    ) {
      return;
    }

    const count = Number(peopleCountValue);
    const prevCount = prevPeopleCountRef.current;
    let effectiveUse4Mic = !!use4MicValue;

    if (count > PEOPLE_COUNT_LARGE_THRESHOLD) {
      if (
        prevCount === undefined ||
        prevCount <= PEOPLE_COUNT_LARGE_THRESHOLD
      ) {
        effectiveUse4Mic = true;
        setValue("use4Mic", true);
      }
    }

    prevPeopleCountRef.current = count;

    if (count >= 1 && room && room.roomType !== RoomType.Dorm) {
      setValue("roomType", getRoomTypeForBooking(effectiveUse4Mic));
    }
  }, [peopleCountValue, use4MicValue, room, setValue]);

  // Set default date & time khi tạo mới schedule (chỉ chạy 1 lần)
  useEffect(() => {
    if (!scheduleId && selectedDate && !isInitialized.current) {
      const base = dayjs(selectedDate);
      const dateStr = base.format("YYYY-MM-DD");
      setValue("startDate", dateStr);
      setValue("endDate", dateStr);

      const now = dayjs();
      const dateWithCurrentTime = base
        .hour(now.hour())
        .minute(now.minute())
        .second(0)
        .millisecond(0);
      const startTimeStr = dateWithCurrentTime.format("HH:mm");
      setValue("startTime", startTimeStr);

      const endDateObj = dateWithCurrentTime.add(2, "hour");
      const endTimeStr = endDateObj.format("HH:mm");
      setValue("endTime", endTimeStr);

      isInitialized.current = true;
    }
  }, [selectedDate, scheduleId, setValue]);

  // Cập nhật End Date & End Time tự động nếu người dùng chưa chỉnh sửa thủ công
  useEffect(() => {
    if (!scheduleId && startDateValue && startTimeValue && !isEndTimeModified) {
      const startDateTime = dayjs(`${startDateValue}T${startTimeValue}`);

      let endDateTime;
      if (statusValue === RoomStatus.Locked) {
        endDateTime = startDateTime.add(5, "minute");
      } else if (statusValue === RoomStatus.Booked) {
        endDateTime = startDateTime.add(2, "hour");
      } else {
        endDateTime = startDateTime.add(1, "hour");
      }
      const newEndTimeStr = endDateTime.format("HH:mm");
      const newEndDateStr = endDateTime.format("YYYY-MM-DD");
      setValue("endTime", newEndTimeStr);
      setValue("endDate", newEndDateStr);
    }
  }, [
    statusValue,
    startDateValue,
    startTimeValue,
    scheduleId,
    setValue,
    isEndTimeModified,
  ]);

  const onSubmit = async (values: FormValues) => {
    try {
      // Ghép date + time thành ISO (dùng startDate/endDate từ form)
      const toISO = (dateStr: string, timeStr: string) => {
        return dayjs(`${dateStr}T${timeStr}`).toISOString();
      };

      const startDt = dayjs(toISO(values.startDate, values.startTime));
      let endDt = dayjs(toISO(values.endDate, values.endTime));
      let endTimeISO = endDt.toISOString();
      // Nếu end < start (qua 00h) thì tự động coi end là ngày hôm sau
      if (!endDt.isAfter(startDt)) {
        endDt = endDt.add(1, "day");
        endTimeISO = endDt.toISOString();
      }
      const startTimeISO = startDt.toISOString();

      if (scheduleId) {
        // Chế độ cập nhật
        updateSchedule({
          id: scheduleId,
          schedule: {
            startTime: startTimeISO,
            endTime: endTimeISO,
            status: values.status,
            note: values.note,
            giftEnabled: values.giftEnabled,
          },
        });
      } else {
        // Chế độ tạo mới: room phải được cung cấp
        if (!room) {
          throw new Error("Room information is required to create schedule.");
        }

        if (room.roomType !== RoomType.Dorm && values.peopleCount) {
          values.roomType = getRoomTypeForBooking(!!values.use4Mic);
        }

        if (values.roomType && values.roomType !== room.roomType) {
          await updateRoom({
            ...room,
            roomType: values.roomType,
          });
        }

        const scheduleData: ICreateRoomScheduleRequest = {
          roomId: room._id,
          startTime: startTimeISO,
          endTime: endTimeISO,
          status: values.status,
          note: values.note,
          giftEnabled: values.giftEnabled,
        };
        await createSchedule(scheduleData);
      }
    } catch (error) {
      console.error("Error submitting schedule:", error);
    }
  };

  const formattedDate = selectedDate
    ? dayjs(selectedDate).format("DD/MM/YYYY")
    : "Hôm nay";

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="max-w-full max-h-[100dvh] overflow-y-auto overscroll-y-contain gap-0 p-0 sm:max-h-[94vh] sm:max-w-[480px]"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <Form {...form}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-6 sm:pb-6"
            >
              <DialogHeader className="pr-10">
                  <DialogTitle>
                    {scheduleId ? "Sửa lịch" : `Đặt phòng ${room?.roomName ?? ""}`}
                  </DialogTitle>
                  {!scheduleId && (
                    <DialogDescription>
                      {formattedDate}
                      {room &&
                        room.roomType !== RoomType.Dorm &&
                        ` · hiện đang là phòng ${getRoomTypeLabel(room.roomType).toLowerCase()}`}
                    </DialogDescription>
                  )}
                </DialogHeader>
                <div className="space-y-5 mt-4">
              <div className="space-y-3">
                <p className="text-sm font-medium">Thời gian</p>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground font-normal">
                          Ngày bắt đầu
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground font-normal">
                          Ngày kết thúc
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              setIsEndTimeModified(true);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground font-normal">
                          Giờ bắt đầu
                        </FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground font-normal">
                          Giờ kết thúc
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              setIsEndTimeModified(true);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trạng thái</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={RoomStatus.Booked}>
                          Booked
                        </SelectItem>
                        <SelectItem value={RoomStatus.Locked}>
                          Locked
                        </SelectItem>
                        <SelectItem value={RoomStatus.Maintenance}>
                          Maintenance
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!scheduleId && room && room.roomType !== RoomType.Dorm && (
                <>
                  <Separator />
                  <FormField
                    control={control}
                    name="peopleCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số khách</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            placeholder="VD: 4"
                            className="w-28"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(event) =>
                              field.onChange(
                                event.target.value === ""
                                  ? undefined
                                  : event.target.value,
                              )
                            }
                          />
                        </FormControl>
                        {willChangeRoomType && suggestedRoomType ? (
                          <p className="text-sm text-muted-foreground">
                            Phòng đang{" "}
                            {getRoomTypeLabel(room.roomType).toLowerCase()}, sẽ
                            chuyển sang{" "}
                            {getRoomTypeLabel(suggestedRoomType).toLowerCase()}.
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Bật 4 mic để chuyển sang phòng lớn. Từ 6 khách
                            trở lên mặc định bật 4 mic.
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="use4Mic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border px-3 py-2">
                        <FormLabel className="font-normal">
                          Sử dụng 4 mic
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </>
              )}

              {!scheduleId && room?.roomType === RoomType.Dorm && (
                <>
                  <Separator />
                  <FormField
                    control={control}
                    name="roomType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loại phòng</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn loại phòng" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roomTypeOptions.map((option) => (
                              <SelectItem
                                value={option.value}
                                key={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <Separator />

              <FormField
                control={control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ghi chú</FormLabel>
                    <FormControl>
                      <Input
                        as="textarea"
                        maxLength={200}
                        placeholder="VD: khách đến trễ 15p"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="giftEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border px-3 py-2">
                    <FormLabel className="font-normal">
                      Cho phép nhận quà
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
                </div>

              <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end pt-6 border-t mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="w-full sm:w-auto"
                >
                  Huỷ
                </Button>
                <Button
                  type="submit"
                  loading={isCreating || isUpdating || isUpdatingRoom}
                  className="w-full sm:w-auto"
                >
                  {scheduleId ? "Lưu" : "Tạo booking"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ScheduleModal;
