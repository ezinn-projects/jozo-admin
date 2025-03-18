// src/components/ExtendSessionModal.tsx
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
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import React, { useState } from "react";

interface ExtendSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: IRoomSchedule;
  refetchSchedules?: () => void;
}

const ExtendSessionModal: React.FC<ExtendSessionModalProps> = ({
  isOpen,
  onClose,
  schedule,
  refetchSchedules,
}) => {
  // Các khoảng thời gian gia hạn tính theo phút
  const extensionOptions = [15, 30, 45, 60];
  const [selectedExtension, setSelectedExtension] = useState<number>(15);

  const { mutate, isPending } = useMutation({
    mutationFn: (extensionMinutes: number) => {
      // Xác định thời gian cơ sở: nếu schedule.endTime tồn tại và > now thì dùng nó, ngược lại dùng now
      const baseTime =
        schedule.endTime && dayjs(schedule.endTime).isAfter(dayjs())
          ? dayjs(schedule.endTime)
          : dayjs();
      const newEndTime = baseTime.add(extensionMinutes, "minute");
      // Gọi API cập nhật với dữ liệu mới (chỉ cập nhật endTime)
      return roomsScheduleApis.updateSchedule(schedule._id, {
        endTime: newEndTime.toISOString(),
      });
    },
    onSuccess: () => {
      refetchSchedules?.();
      onClose();
      toast({
        title: "Success",
        description: `Session extended by ${selectedExtension} minutes.`,
      });
    },
  });

  const handleSubmit = () => {
    mutate(selectedExtension);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Extend Session</DialogTitle>
          <DialogDescription>
            Choose the duration to extend the session. The current session will
            be extended by the selected duration.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-4 mt-4">
          {extensionOptions.map((minutes) => (
            <Button
              key={minutes}
              variant={selectedExtension === minutes ? "default" : "outline"}
              onClick={() => setSelectedExtension(minutes)}
              disabled={isPending}
            >
              {minutes} minutes
            </Button>
          ))}
        </div>
        <DialogFooter className="mt-4 flex justify-end gap-4">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            loading={isPending}
          >
            Extend
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExtendSessionModal;
