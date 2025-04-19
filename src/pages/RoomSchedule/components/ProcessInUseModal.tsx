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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [isConfirmEndOpen, setIsConfirmEndOpen] = useState(false);
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
    setIsConfirmEndOpen(false);
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
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Session Management</DialogTitle>
            <DialogDescription className="text-base">
              Session started at {dayjs(schedule.startTime).format("HH:mm")} and
              end at {dayjs(schedule.endTime).format("HH:mm")}.<br />
              You can choose to end or extend the current session.
            </DialogDescription>
          </DialogHeader>

          {data && (
            <div className="mt-4 p-4 border rounded-lg bg-slate-50">
              <h4 className="text-xl font-bold mb-2">FNB Order Details</h4>
              <p className="text-lg">
                <strong>Room:</strong> {room?.roomName}
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-md shadow-sm">
                  <h5 className="font-semibold text-lg border-b pb-2 mb-2">
                    Drinks:
                  </h5>
                  <ul className="list-disc pl-5 space-y-1">
                    {data?.order?.drinks &&
                      Object.entries(data.order.drinks).map(
                        ([drinkId, quantity]) => {
                          const drinkItem = menus?.find(
                            (menu) => menu._id === drinkId
                          );
                          return (
                            <li key={drinkId} className="text-base">
                              {drinkItem?.name || drinkId}:{" "}
                              <span className="font-medium">{quantity}</span>
                            </li>
                          );
                        }
                      )}
                  </ul>
                  {data?.order?.drinks && (
                    <p className="mt-3 font-medium text-base">
                      <strong>Total Drinks:</strong>{" "}
                      {Object.values(data.order.drinks).reduce(
                        (sum: number, quantity: number) => sum + quantity,
                        0
                      )}
                    </p>
                  )}
                </div>
                <div className="bg-white p-3 rounded-md shadow-sm">
                  <h5 className="font-semibold text-lg border-b pb-2 mb-2">
                    Snacks:
                  </h5>
                  <ul className="list-disc pl-5 space-y-1">
                    {data?.order?.snacks &&
                      Object.entries(data.order.snacks).map(
                        ([snackId, quantity]) => {
                          const snackItem = menus?.find(
                            (menu) => menu._id === snackId
                          );
                          return (
                            <li key={snackId} className="text-base">
                              {snackItem?.name || snackId}:{" "}
                              <span className="font-medium">{quantity}</span>
                            </li>
                          );
                        }
                      )}
                  </ul>
                  {data?.order?.snacks && (
                    <p className="mt-3 font-medium text-base">
                      <strong>Total Snacks:</strong>{" "}
                      {Object.values(data.order.snacks).reduce(
                        (sum: number, quantity: number) => sum + quantity,
                        0
                      )}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 bg-white p-4 rounded-md shadow-sm">
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
                <p className="text-xl font-bold text-green-600 my-2">
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
                          // Make sure we're parsing the price correctly
                          const price = drinkItem?.price
                            ? typeof drinkItem.price === "string"
                              ? parseInt(drinkItem.price.replace(/\./g, ""))
                              : drinkItem.price
                            : 0;

                          return sum + price * Number(quantity);
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
                          // Make sure we're parsing the price correctly
                          const price = snackItem?.price
                            ? typeof snackItem.price === "string"
                              ? parseInt(snackItem.price.replace(/\./g, ""))
                              : snackItem.price
                            : 0;

                          return sum + price * Number(quantity);
                        },
                        0
                      );
                    }

                    // Ensure we're displaying thousands properly (75000 → 75.000)
                    return `${totalPrice.toLocaleString("vi-VN")} VND`;
                  })()}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-600">
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
            </div>
          )}

          <div className="flex flex-wrap gap-4 mt-6">
            <Button
              variant="outline"
              onClick={openFnbModal}
              className="text-base px-5 py-2 h-auto"
            >
              Open F&B Modal
            </Button>
            <Button
              onClick={handleExtendSession}
              disabled={isPending}
              className="text-base px-5 py-2 h-auto"
            >
              Extend Session
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsBillModalOpen(true)}
              disabled={isPending}
              className="text-base px-5 py-2 h-auto"
            >
              Preview Bill
            </Button>
            <Button
              variant="destructive"
              onClick={() => setIsConfirmEndOpen(true)}
              disabled={isPending}
              className="text-base px-5 py-2 h-auto"
            >
              End Session
            </Button>
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="text-base px-5 py-2 h-auto"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmEndOpen} onOpenChange={setIsConfirmEndOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kết thúc phiên?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn kết thúc phiên này không? Hành động này sẽ
              tạo hóa đơn và không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleOpenBillModal}
            >
              Tiếp tục kết thúc
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
