import { IRoomSchedule } from "@/@types/Room";
import roomsScheduleApis from "@/apis/roomSchedule.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RoomStatus } from "@/constants/enum";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import * as React from "react";

interface ProcessBookedModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: IRoomSchedule;
  refetchSchedules: VoidFunction;
}

const ProcessBookedModal: React.FC<ProcessBookedModalProps> = ({
  isOpen,
  onClose,
  schedule,
  refetchSchedules,
}) => {
  const eventStart = dayjs(schedule.startTime);
  const eventEnd = schedule.endTime
    ? dayjs(schedule.endTime)
    : eventStart.add(120, "minute");

  // State cho thời gian điều chỉnh
  const [adjustedStartTime, setAdjustedStartTime] = React.useState<string>("");
  const [adjustedEndTime, setAdjustedEndTime] = React.useState<string>("");

  // Khởi tạo state khi schedule thay đổi
  React.useEffect(() => {
    if (schedule) {
      setAdjustedStartTime(dayjs(schedule.startTime).format("HH:mm"));
      const defaultEnd = schedule.endTime
        ? dayjs(schedule.endTime)
        : dayjs(schedule.startTime).add(120, "minute");
      setAdjustedEndTime(defaultEnd.format("HH:mm"));
    }
  }, [schedule]);

  const { mutate, isPending } = useMutation({
    mutationFn: (updateData: Partial<IRoomSchedule>) =>
      roomsScheduleApis.updateSchedule(schedule._id, updateData),
    onSuccess: (_, variables) => {
      onClose();
      refetchSchedules();
      toast({
        title: "Success",
        description: `Schedule updated${
          variables.status ? " to " + variables.status : ""
        }`,
      });
    },
  });

  const handleUpdate = async (newStatus: RoomStatus) => {
    const now = dayjs();
    const updateData: Partial<IRoomSchedule> = { status: newStatus };

    // Nếu chuyển sang "In use", cập nhật startTime thành thời gian hiện tại.
    if (newStatus === RoomStatus.InUse) {
      updateData.startTime = now.toISOString();
    }
    // Nếu chuyển sang "Cancelled", cập nhật endTime thành thời gian hiện tại.
    else if (newStatus === RoomStatus.Cancelled) {
      updateData.endTime = now.toISOString();
    }

    // Gọi API update với dữ liệu mới (bao gồm status và thời gian)
    mutate(updateData);
  };

  // Hàm cập nhật thời gian mới dựa vào input
  const handleUpdateTime = () => {
    // Lấy phần ngày từ schedule hiện có
    const datePart = dayjs(schedule.startTime).format("YYYY-MM-DD");
    const newStartTime = dayjs(`${datePart}T${adjustedStartTime}`);
    const newEndTime = dayjs(`${datePart}T${adjustedEndTime}`);

    if (!newStartTime.isValid() || !newEndTime.isValid()) {
      toast({
        title: "Invalid time",
        description: "Please enter valid times.",
      });
      return;
    }

    if (newEndTime.isBefore(newStartTime)) {
      toast({
        title: "Invalid time",
        description: "End time must be after start time.",
      });
      return;
    }

    const updateData: Partial<IRoomSchedule> = {
      startTime: newStartTime.toISOString(),
      endTime: newEndTime.toISOString(),
    };

    mutate(updateData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Process Booked Event</DialogTitle>
          <DialogDescription>
            Here is the event details. You can cancel the booking, mark the
            event as in use, or adjust the event time.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <p>
            <span className="font-medium">Start:</span>{" "}
            {eventStart.format("HH:mm")}
          </p>
          <p>
            <span className="font-medium">End:</span> {eventEnd.format("HH:mm")}
          </p>
          {schedule?.note && (
            <p>
              <span className="font-medium">Note:</span> {schedule.note}
            </p>
          )}
        </div>

        {/* Phần điều chỉnh thời gian */}
        <div className="mt-4 space-y-2">
          <h3 className="font-semibold">Adjust Time</h3>
          <div className="flex flex-col space-y-1">
            <label htmlFor="adjustedStartTime" className="text-sm">
              Start Time:
            </label>
            <input
              id="adjustedStartTime"
              type="time"
              value={adjustedStartTime}
              onChange={(e) => setAdjustedStartTime(e.target.value)}
              className="border rounded p-1"
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label htmlFor="adjustedEndTime" className="text-sm">
              End Time:
            </label>
            <input
              id="adjustedEndTime"
              type="time"
              value={adjustedEndTime}
              onChange={(e) => setAdjustedEndTime(e.target.value)}
              className="border rounded p-1"
            />
          </div>
          <Button
            variant="default"
            onClick={handleUpdateTime}
            loading={isPending}
          >
            Update Time
          </Button>
        </div>

        <DialogFooter className="flex justify-end space-x-2 mt-4">
          <Button
            variant="destructive"
            onClick={() => {
              handleUpdate(RoomStatus.Cancelled);
            }}
            loading={isPending}
          >
            Cancel Booking
          </Button>
          <Button
            variant="default"
            onClick={() => {
              handleUpdate(RoomStatus.InUse);
            }}
            loading={isPending}
          >
            Mark as In Use
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProcessBookedModal;
