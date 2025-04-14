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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import dayjs from "dayjs";
import React, { useState } from "react";
import BillPreviewModal from "./BillPreviewModal";
// import { ApiResponse } from "@/@types/ApiResponse";
import { IRoom } from "@/@types/Room";
import { useGetAllMenus } from "@/hooks/use-fnb-menu";
// import BillPreviewModal from "./BillPreviewModal";

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
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const { data: menus } = useGetAllMenus();
  const openFnbModal = () => setIsFnbModalOpen(true);
  const closeFnbModal = () => setIsFnbModalOpen(false);

  const queryClient = useQueryClient();
  const roomsData = queryClient.getQueryData<
    AxiosResponse<HTTPResponse<IRoom[]>>
  >(["rooms"]);

  console.log("roomsData", roomsData);

  const room = roomsData?.data.result?.find(
    (room) => room._id === schedule.roomId
  );

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

  const handleOpenBillModal = () => {
    // console.log("Attempting to open Bill Modal"); // Debug
    setIsBillModalOpen(true);
  };

  const handleCompleteSession = () => {
    const now = dayjs();
    const updateData: Partial<IRoomSchedule> = {
      ...schedule,
      status: RoomStatus.Finished,
      endTime: now.toISOString(),
    };
    mutate(updateData, { onSuccess: () => refetchSchedules?.() });
  };

  const handleExtendSession = () => {
    onExtendSession();
  };

  const closeBillModal = () => {
    setIsBillModalOpen(false);
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

          {data && (
            <div className="mt-4">
              <h4 className="text-lg font-bold">FNB Order Details</h4>
              <p>
                <strong>Room:</strong> {room?.roomName}
              </p>
              <div className="mt-2">
                <h5 className="font-semibold">Drinks:</h5>
                <ul className="list-disc pl-5">
                  {data?.order?.drinks &&
                    Object.entries(data.order.drinks).map(
                      ([drink, quantity]) => (
                        <li key={drink}>
                          {drink}: {quantity}
                        </li>
                      )
                    )}
                </ul>
                {data?.order?.drinks && (
                  <p className="mt-1 font-medium">
                    <strong>Total Drinks:</strong>{" "}
                    {Object.values(data.order.drinks).reduce(
                      (sum: number, quantity: number) => sum + quantity,
                      0
                    )}
                  </p>
                )}
              </div>
              <div className="mt-2">
                <h5 className="font-semibold">Snacks:</h5>
                <ul className="list-disc pl-5">
                  {data?.order?.snacks &&
                    Object.entries(data.order.snacks).map(
                      ([snackId, quantity]) => {
                        const snackItem = menus?.find(
                          (menu) => menu._id === snackId
                        );
                        return (
                          <li key={snackId}>
                            {snackItem?.name || snackId}: {quantity}
                          </li>
                        );
                      }
                    )}
                </ul>
                {data?.order?.snacks && (
                  <p className="mt-1 font-medium">
                    <strong>Total Snacks:</strong>{" "}
                    {Object.values(data.order.snacks).reduce(
                      (sum: number, quantity: number) => sum + quantity,
                      0
                    )}
                  </p>
                )}
              </div>
              <div className="mt-2">
                <p className="text-lg font-bold">
                  <strong>Total Items:</strong>{" "}
                  {(data?.order?.drinks
                    ? Object.values(data.order.drinks).reduce(
                        (sum: number, quantity: number) => sum + quantity,
                        0
                      )
                    : 0) +
                    (data?.order?.snacks
                      ? Object.values(data.order.snacks).reduce(
                          (sum: number, quantity: number) => sum + quantity,
                          0
                        )
                      : 0)}
                </p>
                <p className="text-lg font-bold text-green-600">
                  <strong>Total Price:</strong>{" "}
                  {(() => {
                    let totalPrice = 0;

                    // Calculate drinks total
                    if (data?.order?.drinks) {
                      totalPrice += Object.entries(data.order.drinks).reduce(
                        (sum, [drinkId, quantity]) => {
                          const drinkItem = menus?.find(
                            (menu) => menu._id === drinkId
                          );
                          return (
                            sum +
                            (Number(drinkItem?.price) || 0) * Number(quantity)
                          );
                        },

                        0
                      );
                    }

                    // Calculate snacks total using menus from useGetAllMenus
                    if (data?.order?.snacks) {
                      totalPrice += Object.entries(data.order.snacks).reduce(
                        (sum, [snackId, quantity]) => {
                          const snackItem = menus?.find(
                            (menu) => menu._id === snackId
                          );
                          return (
                            sum +
                            (Number(snackItem?.price) || 0) * Number(quantity)
                          );
                        },
                        0
                      );
                    }

                    return `${totalPrice.toLocaleString()} VND`;
                  })()}
                </p>
                <p>
                  <strong>Created At:</strong>{" "}
                  {dayjs(data.createdAt).format("HH:mm DD-MM-YYYY")}
                </p>
                <p>
                  <strong>Updated At:</strong>{" "}
                  {dayjs(data.updatedAt).format("HH:mm DD-MM-YYYY")}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-4">
            <Button variant="outline" onClick={openFnbModal}>
              Open F&B Modal
            </Button>
            <Button onClick={handleExtendSession} disabled={isPending}>
              Extend Session
            </Button>
            <Button
              variant="destructive"
              onClick={handleOpenBillModal}
              disabled={isPending}
            >
              End Session
            </Button>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FoodDrinkModal
        refetch={refetch}
        isOpen={isFnbModalOpen}
        onClose={closeFnbModal}
        scheduleId={schedule._id}
      />

      <BillPreviewModal
        isOpen={isBillModalOpen}
        onClose={closeBillModal}
        schedule={schedule}
        onConfirmEnd={handleCompleteSession}
      />
    </>
  );
};

export default ProcessInUseModal;
