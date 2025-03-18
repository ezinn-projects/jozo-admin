import { IRoom } from "@/@types/Room";
import roomsScheduleApis, {
  ICreateRoomScheduleRequest,
} from "@/apis/roomSchedule.api";
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
import { RoomStatus } from "@/constants/enum";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Define schema using zod
const scheduleSchema = z.object({
  startTime: z.string().nonempty("Start time is required"),
  endTime: z.string().nonempty("End time is required"),
  status: z.nativeEnum(RoomStatus),
  note: z.string().max(200).optional(),
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
      startTime: "",
      endTime: "",
      status: RoomStatus.Booked,
      note: "",
    },
  });

  const { control, handleSubmit, setValue, watch } = form;
  const startTimeValue = watch("startTime");
  const statusValue = watch("status");

  // Biến cờ để đánh dấu nếu người dùng đã tự chỉnh sửa End Time
  const [isEndTimeModified, setIsEndTimeModified] = useState(false);

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

  const { mutate: createSchedule, isPending: isCreating } = useMutation({
    mutationFn: (payload: ICreateRoomScheduleRequest) =>
      roomsScheduleApis.createSchedule(payload),
    onSuccess: () => {
      refetchSchedules();
      onClose();
    },
    onError: (error) => {
      console.error("Error creating schedule:", error);
    },
  });

  // Dùng ref để đảm bảo khởi tạo giá trị mặc định chỉ chạy 1 lần
  const isInitialized = useRef(false);

  // Set default time values khi tạo mới schedule (chỉ chạy 1 lần)
  useEffect(() => {
    if (!scheduleId && selectedDate && !isInitialized.current) {
      const now = new Date();
      const dateWithCurrentTime = new Date(selectedDate);
      dateWithCurrentTime.setHours(now.getHours());
      dateWithCurrentTime.setMinutes(now.getMinutes());
      // Format to HH:mm cho input type="time"
      const startTimeStr = format(dateWithCurrentTime, "HH:mm");
      setValue("startTime", startTimeStr);

      // Tính End Time mặc định dựa trên status Booked (+2 giờ)
      const endDate = new Date(dateWithCurrentTime);
      endDate.setHours(endDate.getHours() + 2);
      const endTimeStr = format(endDate, "HH:mm");
      setValue("endTime", endTimeStr);

      isInitialized.current = true;
    }
  }, [selectedDate, scheduleId, setValue]);

  // Cập nhật End Time tự động nếu người dùng chưa chỉnh sửa thủ công
  useEffect(() => {
    if (!scheduleId && selectedDate && startTimeValue && !isEndTimeModified) {
      // Parse giờ và phút từ startTime (định dạng "HH:mm")
      const [hours, minutes] = startTimeValue.split(":");
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

      let endDateTime: Date;
      if (statusValue === RoomStatus.Locked) {
        // Nếu Locked: endTime = startTime + 5 phút
        endDateTime = new Date(startDateTime);
        endDateTime.setMinutes(endDateTime.getMinutes() + 5);
      } else if (statusValue === RoomStatus.Booked) {
        // Nếu Booked: endTime = startTime + 2 giờ
        endDateTime = new Date(startDateTime);
        endDateTime.setHours(endDateTime.getHours() + 2);
      } else {
        // Các trạng thái khác: mặc định +1 giờ
        endDateTime = new Date(startDateTime);
        endDateTime.setHours(endDateTime.getHours() + 1);
      }
      const newEndTimeStr = format(endDateTime, "HH:mm");
      setValue("endTime", newEndTimeStr);
    }
  }, [
    statusValue,
    startTimeValue,
    selectedDate,
    scheduleId,
    setValue,
    isEndTimeModified,
  ]);

  const onSubmit = async (values: FormValues) => {
    try {
      // Hàm chuyển đổi chuỗi HH:mm thành chuỗi ISO dựa trên selectedDate
      const parseTime = (timeStr: string, baseDate: Date) => {
        const [hours, minutes] = timeStr.split(":");
        const date = new Date(baseDate);
        date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        return date.toISOString();
      };

      const startTimeISO = parseTime(values.startTime, selectedDate);
      const endTimeISO = parseTime(values.endTime, selectedDate);

      if (scheduleId) {
        // Chế độ cập nhật
        updateSchedule({
          id: scheduleId,
          schedule: {
            startTime: startTimeISO,
            endTime: endTimeISO,
            status: values.status,
            note: values.note,
          },
        });
      } else {
        // Chế độ tạo mới: room phải được cung cấp
        if (!room) {
          throw new Error("Room information is required to create schedule.");
        }
        const scheduleData: ICreateRoomScheduleRequest = {
          roomId: room._id,
          startTime: startTimeISO,
          endTime: endTimeISO,
          status: values.status,
          note: values.note,
        };
        createSchedule(scheduleData);
      }
      refetchSchedules();
      onClose();
    } catch (error) {
      console.error("Error submitting schedule:", error);
    }
  };

  const formattedDate = selectedDate
    ? format(selectedDate, "dd/MM/yyyy")
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

              <DialogFooter>
                <Button type="submit" loading={isCreating || isUpdating}>
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
