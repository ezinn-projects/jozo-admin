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
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Switch } from "@/components/ui/switch";
import { roomTypeOptions } from "@/pages/RoomsManagement/constants";

// Define schema using zod
const scheduleSchema = z.object({
  startDate: z.string().nonempty("Start date is required"),
  endDate: z.string().nonempty("End date is required"),
  startTime: z.string().nonempty("Start time is required"),
  endTime: z.string().nonempty("End time is required"),
  status: z.nativeEnum(RoomStatus),
  roomType: z.nativeEnum(RoomType).optional(),
  note: z.string().max(200).optional(),
  giftEnabled: z.boolean().optional(),
});

type FormValues = z.infer<typeof scheduleSchema>;

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
  // State điều khiển FoodDrinkModal
  // const [isOpenModal, setIsOpenModal] = useState<boolean>(false);

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
    },
  });

  const { control, handleSubmit, setValue, watch } = form;
  const startDateValue = watch("startDate");
  const startTimeValue = watch("startTime");
  const statusValue = watch("status");

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

  useEffect(() => {
    if (!scheduleId && room && isOpen) {
      setValue("roomType", room.roomType);
    }
  }, [scheduleId, room, isOpen, setValue]);

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
    : "Today";

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {scheduleId
                ? "Update Schedule"
                : `Create Schedule for ${room?.roomName} (${formattedDate})`}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
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
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Time</FormLabel>
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
                    <FormItem className="flex flex-col">
                      <FormLabel>End Time</FormLabel>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {!scheduleId && room && (
                  <FormField
                    control={control}
                    name="roomType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room Type</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select room type" />
                            </SelectTrigger>
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              <FormField
                control={control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Input
                        as="textarea"
                        maxLength={200}
                        placeholder="Enter note"
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
                  <FormItem className="">
                    <FormLabel>Allow Gift</FormLabel>
                    <FormControl className="ml-2">
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  loading={isCreating || isUpdating || isUpdatingRoom}
                >
                  {scheduleId ? "Update" : "Create"}
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
