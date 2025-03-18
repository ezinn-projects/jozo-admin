// src/components/ProcessInUseModal.tsx
import { IRoomSchedule } from "@/@types/Room";
import fnbOrderApis from "@/apis/fnbOrder.apis";
import roomsScheduleApis from "@/apis/roomSchedule.api";
import FoodDrinkModal from "@/components/modules/RoomSchedule/FoodDrinkModal";
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
import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import React, { useState } from "react";

// Định nghĩa các prop cần thiết cho modal
interface ProcessInUseModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: IRoomSchedule;
  refetchSchedules?: () => void;
  onExtendSession: () => void;
}

const ProcessInUseModal: React.FC<ProcessInUseModalProps> = ({
  isOpen,
  onClose,
  schedule,
  refetchSchedules,
  onExtendSession,
}) => {
  const [isFnbModalOpen, setIsFnbModalOpen] = useState(false);

  const openFnbModal = () => setIsFnbModalOpen(true);
  const closeFnbModal = () => setIsFnbModalOpen(false);

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: Partial<IRoomSchedule>) =>
      roomsScheduleApis.updateSchedule(schedule._id, payload),
    onSuccess: (_, variables) => {
      refetchSchedules?.();
      onClose();
      toast({
        title: "Success",
        description: `Schedule updated to ${variables.status}`,
      });
    },
  });

  const { data, refetch } = useQuery({
    queryKey: ["fnbOrderByScheduleId", schedule._id],
    queryFn: () => fnbOrderApis.getFnbOrderById(schedule._id),
    enabled: !!schedule._id,
    select: (data) => data.data.result,
  });

  // API hoàn thành phiên sử dụng
  const handleCompleteSession = () => {
    const now = dayjs();
    const updateData: Partial<IRoomSchedule> = {
      ...schedule,
      status: RoomStatus.Finish,
      endTime: now.toISOString(),
    };

    mutate(updateData, { onSuccess: () => refetchSchedules?.() });
  };

  const handleExtendSession = () => {
    onExtendSession();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Session Management</DialogTitle>
            <DialogDescription>
              Session started at {dayjs(schedule.startTime).format("HH:mm")} and
              end at {dayjs(schedule.endTime).format("HH:mm")}.<br />
              You can choose to end or extend the current session.
            </DialogDescription>
          </DialogHeader>

          {/* Hiển thị chi tiết đơn FNB nếu có dữ liệu */}
          {data && data && (
            <div className="mt-4">
              <h4 className="text-lg font-bold">FNB Order Details</h4>
              <p>
                <strong>Room Schedule ID:</strong> {data.roomScheduleId}
              </p>
              <div className="mt-2">
                <h5 className="font-semibold">Drinks:</h5>
                <ul className="list-disc pl-5">
                  {data?.order?.drinks &&
                    Object.entries(data?.order?.drinks)?.map(
                      ([drink, quantity]) => (
                        <li key={drink}>
                          {drink}: {quantity}
                        </li>
                      )
                    )}
                </ul>
              </div>
              <div className="mt-2">
                <h5 className="font-semibold">Snacks:</h5>
                <ul className="list-disc pl-5">
                  {data?.order?.snacks &&
                    Object.entries(data.order.snacks).map(
                      ([snack, quantity]) => (
                        <li key={snack}>
                          {snack}: {quantity}
                        </li>
                      )
                    )}
                </ul>
              </div>
              <div className="mt-2">
                <p>
                  <strong>Created At:</strong>{" "}
                  {dayjs(data?.createdAt).format("HH:mm DD-MM-YYYY")}
                </p>
                <p>
                  <strong>Updated At:</strong>{" "}
                  {dayjs(data?.updatedAt).format("HH:mm DD-MM-YYYY")}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-4">
            {/* Nút để mở modal F&B */}
            <Button variant="outline" onClick={openFnbModal}>
              Open F&B Modal
            </Button>
            <Button
              variant="destructive"
              onClick={handleCompleteSession}
              disabled={isPending}
              loading={isPending}
            >
              End Session
            </Button>
            <Button
              onClick={handleExtendSession}
              disabled={isPending}
              loading={isPending}
            >
              Extend Session
            </Button>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Render FoodDrinkModal với trạng thái điều khiển */}
      <FoodDrinkModal
        refetch={refetch}
        isOpen={isFnbModalOpen}
        onClose={closeFnbModal}
        scheduleId={schedule._id}
      />
    </>
  );
};

export default ProcessInUseModal;
