import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import roomScheduleApis from "@/apis/roomSchedule.api";
import React from "react";
import dayjs from "dayjs";
import { IRoomSchedule } from "@/@types/Room";
import { RoomStatus } from "@/constants/enum";
import { AxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";
import FoodDrinkModal from "@/components/modules/RoomSchedule/FoodDrinkModal";
// Giả sử bạn đã import FoodDrinkModal từ vị trí tương ứng
// import FoodDrinkModal from "@/components/modals/FoodDrinkModal";

interface ProcessLockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleId: string;
  refetchSchedules: () => void;
}

const ProcessLockedModal: React.FC<ProcessLockedModalProps> = ({
  isOpen,
  onClose,
  scheduleId,
  refetchSchedules,
}) => {
  const [isFnbModalOpen, setIsFnbModalOpen] = useState(false);

  const openFnbModal = () => setIsFnbModalOpen(true);
  const closeFnbModal = () => setIsFnbModalOpen(false);

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: Partial<IRoomSchedule>) =>
      roomScheduleApis.updateSchedule(scheduleId, payload),
    onSuccess: (_, variables) => {
      refetchSchedules();
      onClose();
      toast({
        title: "Success",
        description: `Schedule updated to ${variables}`,
      });
    },
    onError: (error) => {
      const _error = error as AxiosError;
      console.error("Error updating schedule:", _error.message);
      toast({
        title: "Error",
        description: _error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpdate = async (newStatus: RoomStatus) => {
    const now = dayjs();
    const updateData: Partial<IRoomSchedule> = { status: newStatus };

    if (newStatus === RoomStatus.InUse) {
      updateData.startTime = now.toISOString();
      updateData.endTime = now.add(2, "hour").toISOString();
    } else if (newStatus === RoomStatus.Cancelled) {
      updateData.endTime = now.toISOString();
    }

    mutate(updateData);
  };

  const refetch = () => {};

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Locked Schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Please choose an action for the locked schedule:</p>
            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => handleUpdate(RoomStatus.Cancelled)}
              >
                Cancelled
              </Button>
              <Button
                onClick={() => handleUpdate(RoomStatus.InUse)}
                loading={isPending}
              >
                In use
              </Button>
              {/* Nút để mở modal F&B */}
              <Button variant="outline" onClick={openFnbModal}>
                Open F&B Modal
              </Button>
            </div>
          </div>
          <DialogFooter />
        </DialogContent>
      </Dialog>

      {/* Render FoodDrinkModal với trạng thái điều khiển */}
      <FoodDrinkModal
        isOpen={isFnbModalOpen}
        onClose={closeFnbModal}
        scheduleId={scheduleId}
        refetch={refetch}
      />
    </>
  );
};

export default ProcessLockedModal;
