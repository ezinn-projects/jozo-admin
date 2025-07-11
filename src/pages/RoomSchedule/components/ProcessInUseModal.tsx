import { IRoomSchedule } from "@/@types/Room";
import billAPis from "@/apis/bill.apis";
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
import { PaymentMethod, RoomStatus } from "@/constants/enum";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
// import BillPreviewModal from "./BillPreviewModal";
// import { ApiResponse } from "@/@types/ApiResponse";
import { IRoom } from "@/@types/Room";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetStandardPromotions } from "@/hooks/promotion";
import { useGetAllMenus } from "@/hooks/use-fnb-menu";
import useAuth from "@/hooks/useAuth";
import { Clock, Gift, Printer } from "lucide-react";

// Define bill interfaces
interface BillItem {
  description: string;
  price: number;
  quantity: number;
  originalPrice?: number;
  discountName?: string;
  discountPercentage?: number;
  promotionId?: string;
}

interface BillData {
  _id?: string;
  totalAmount?: number;
  items?: BillItem[];
  createdAt?: string | Date;
  paymentMethod?: string;
  note?: string;
  endTime?: string | Date;
  startTime?: string | Date;
}

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
  const [isConfirmEndOpen, setIsConfirmEndOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<string>("");
  const [customEndTime, setCustomEndTime] = useState<string>("");
  const [customStartTime, setCustomStartTime] = useState<string>("");
  const { data: menus } = useGetAllMenus();
  const { user } = useAuth();
  const { data: standardPromotions } = useGetStandardPromotions();
  const promotionList = standardPromotions?.data.result || [];
  const openFnbModal = () => setIsFnbModalOpen(true);
  const closeFnbModal = () => setIsFnbModalOpen(false);

  // Set default end time when modal opens
  useEffect(() => {
    if (isOpen) {
      setCustomEndTime(dayjs().format("HH:mm"));
      setCustomStartTime(dayjs(schedule.startTime).format("HH:mm"));
    }
  }, [isOpen, schedule.startTime]);

  const queryClient = useQueryClient();
  const roomsData = queryClient.getQueryData<
    AxiosResponse<HTTPResponse<IRoom[]>>
  >(["rooms"]);

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

  // Bill data query
  const { data: billData, refetch: refetchBill } = useQuery({
    queryKey: [
      "bill",
      schedule._id,
      selectedPromotion,
      customEndTime,
      customStartTime,
    ],
    queryFn: () =>
      billAPis.getBillByScheduleId(
        schedule._id,
        selectedPromotion || undefined,
        customEndTime || undefined,
        customStartTime || undefined
      ),
    enabled: isOpen,
  });

  const billResult = (billData?.data.result || {}) as BillData;
  const {
    totalAmount,
    items = [],
    createdAt,
    paymentMethod = PaymentMethod.Cash,
    note,
    endTime,
    startTime,
  } = billResult;

  console.log("Current payment method:", paymentMethod);

  const handleCompleteSession = () => {
    const actualEndTime = customEndTime
      ? dayjs()
          .set("hour", parseInt(customEndTime.split(":")[0]))
          .set("minute", parseInt(customEndTime.split(":")[1]))
          .set("second", 0)
          .toISOString()
      : dayjs().toISOString();

    const actualStartTime = customStartTime
      ? dayjs(schedule.startTime)
          .set("hour", parseInt(customStartTime.split(":")[0]))
          .set("minute", parseInt(customStartTime.split(":")[1]))
          .set("second", 0)
          .toISOString()
      : schedule.startTime;

    // Tạo bill object để save
    const billToSave = {
      scheduleId: schedule._id,
      roomId: schedule.roomId,
      items: items || [],
      totalAmount: totalAmount || 0,
      paymentMethod: paymentMethod,
      startTime: actualStartTime,
      endTime: actualEndTime,
      note: note,
      promotionId: selectedPromotion || undefined,
    };

    // Save bill trước khi update schedule status
    saveBillMutation(billToSave, {
      onSuccess: () => {
        // Sau khi save bill thành công, update schedule status
        const updateData: Partial<IRoomSchedule> = {
          ...schedule,
          status: RoomStatus.Finished,
          endTime: actualEndTime,
          startTime: actualStartTime,
        };
        mutate(updateData, { onSuccess: () => refetchSchedules?.() });
      },
    });
  };

  const handleExtendSession = () => {
    onExtendSession();
  };

  const handleRefreshBill = () => {
    refetch();
    refetchBill();
  };

  const handlePaymentMethodChange = (value: string) => {
    queryClient.setQueryData(
      ["bill", schedule._id, selectedPromotion, customEndTime, customStartTime],
      (oldData: unknown) => {
        console.log("oldData", oldData);
        if (!oldData) return oldData;
        const typedOldData = oldData as {
          data?: {
            result?: {
              paymentMethod?: string;
            };
          };
        };
        return {
          ...typedOldData,
          data: {
            ...typedOldData.data,
            result: {
              ...typedOldData.data?.result,
              paymentMethod: value,
            },
          },
        };
      }
    );
  };

  const handlePromotionChange = (value: string) => {
    setSelectedPromotion(value === "none" ? "" : value);
    refetchBill();
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomEndTime(e.target.value);
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomStartTime(e.target.value);
  };

  const getAppliedPromotion = () => {
    if (!selectedPromotion) return null;
    return promotionList.find((promo) => promo._id === selectedPromotion);
  };

  const appliedPromotion = getAppliedPromotion();

  // Sử dụng useMutation để gọi API in hóa đơn
  const { mutate: printBill } = useMutation({
    mutationFn: () =>
      billAPis.printBill(schedule._id, {
        paymentMethod,
        actualEndTime: customEndTime
          ? dayjs()
              .set("hour", parseInt(customEndTime.split(":")[0]))
              .set("minute", parseInt(customEndTime.split(":")[1]))
              .set("second", 0)
              .toISOString()
          : dayjs(endTime).toISOString(),
        actualStartTime: customStartTime
          ? dayjs(schedule.startTime)
              .set("hour", parseInt(customStartTime.split(":")[0]))
              .set("minute", parseInt(customStartTime.split(":")[1]))
              .set("second", 0)
              .toISOString()
          : dayjs(startTime || schedule.startTime).toISOString(),
        promotionId: selectedPromotion || undefined,
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Hóa đơn đã được in",
      });
    },
    onError: (error) => {
      console.error("Lỗi khi tạo hóa đơn:", error);
      toast({
        title: "Error",
        description: "Có lỗi xảy ra khi tạo hóa đơn",
        variant: "destructive",
      });
    },
  });

  // Mutation để save bill vào collection bills
  const { mutate: saveBillMutation, isPending: isSavingBill } = useMutation({
    mutationFn: billAPis.saveBill,
    onSuccess: () => {
      console.log("Bill saved successfully");
    },
    onError: (error) => {
      console.error("Lỗi khi lưu hóa đơn:", error);
      toast({
        title: "Error",
        description: "Có lỗi xảy ra khi lưu hóa đơn",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Session Management</DialogTitle>
            <DialogDescription className="text-base">
              Session started at {dayjs(schedule.startTime).format("HH:mm")} and
              end at {dayjs(schedule.endTime).format("HH:mm")}.<br />
              You can choose to end or extend the current session.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* FNB Orders Section */}
            <div className="mt-4 p-4 border rounded-lg bg-slate-50">
              <h4 className="text-xl font-bold mb-2">FNB Order Details</h4>
              <p className="text-lg">
                <strong>Room:</strong> {room?.roomName}
              </p>
              {data && (
                <>
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
                                  <span className="font-medium">
                                    {quantity}
                                  </span>
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
                                  <span className="font-medium">
                                    {quantity}
                                  </span>
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
                          totalPrice += Object.entries(
                            data.order.drinks
                          ).reduce((sum, [drinkId, quantity]) => {
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
                          }, 0);
                        }

                        // Calculate snacks total using menus from useGetAllMenus
                        if (data?.order?.snacks) {
                          totalPrice += Object.entries(
                            data.order.snacks
                          ).reduce((sum, [snackId, quantity]) => {
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
                          }, 0);
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
                </>
              )}
            </div>

            {/* Bill Preview Section */}
            <div className="mt-4 p-4 border rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 font-mono text-sm">
              <h4 className="text-center text-lg text-purple-700 font-bold mb-2">
                🎉 Jozo Bill 🎉
              </h4>

              <div className="space-y-2 text-gray-800">
                <div className="text-center">
                  <p>
                    Phòng: <span className="font-bold">{room?.roomName}</span>
                  </p>
                  <p>
                    Ngày:{" "}
                    {dayjs(createdAt || new Date()).format("DD/MM/YYYY HH:mm")}
                  </p>
                  <p>
                    Mã: {room?._id.slice(0, 2)}{" "}
                    {dayjs(createdAt || new Date()).format("HHmmDDMMYYYY")}
                  </p>
                </div>
                <div className="border-t-2 border-dashed border-purple-400" />
                <div>
                  {/* Custom Start Time Input */}
                  <div className="flex items-center gap-2 my-2">
                    <Clock className="w-4 h-4 text-purple-500" />
                    <Label htmlFor="start-time" className="text-sm">
                      Thời gian bắt đầu:
                    </Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={customStartTime}
                      onChange={handleStartTimeChange}
                      className="w-36 h-8 text-sm"
                    />
                  </div>

                  {/* Custom End Time Input */}
                  <div className="flex items-center gap-2 my-2">
                    <Clock className="w-4 h-4 text-purple-500" />
                    <Label htmlFor="end-time" className="text-sm">
                      Thời gian kết thúc:
                    </Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={customEndTime}
                      onChange={handleEndTimeChange}
                      className="w-36 h-8 text-sm"
                    />
                  </div>

                  <p>
                    Người tạo: <span className="font-bold">{user?.name}</span>
                  </p>
                </div>
                <div className="border-t-2 border-dashed border-purple-400" />
                <div>
                  <div className="grid grid-cols-12 font-bold text-purple-600 gap-1">
                    <span className="col-span-5">Tên</span>
                    <span className="col-span-1 text-right">SL</span>
                    <span className="col-span-3 text-right">Đơn Giá</span>
                    <span className="col-span-3 text-right">Thành Tiền</span>
                  </div>
                  {items.map((item: BillItem, index: number) => (
                    <div key={index}>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 truncate">
                          {item.description}
                        </span>
                        <span className="col-span-1 text-right">
                          {item.quantity}
                        </span>
                        <span className="col-span-3 text-right">
                          {item.price.toLocaleString("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          })}
                        </span>
                        <span className="col-span-3 text-right">
                          {(item.price * item.quantity).toLocaleString(
                            "vi-VN",
                            {
                              style: "currency",
                              currency: "VND",
                            }
                          )}
                        </span>
                      </div>
                      {item.discountName && item.discountPercentage ? (
                        <div className="grid grid-cols-12 gap-1 text-xs text-green-600 italic">
                          <span className="col-span-9 pl-4">
                            - {item.discountName} ({item.discountPercentage}%)
                          </span>
                          <span className="col-span-3 text-right">
                            {(
                              (item.price *
                                item.quantity *
                                (item.discountPercentage || 0)) /
                              100
                            ).toLocaleString("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            })}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className="border-t-2 border-dashed border-purple-400" />

                {/* Lucky Draw Promotion Section */}
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-4 h-4 text-pink-500" />
                  <span>Khuyến mãi bốc thăm:</span>
                  <Select
                    value={selectedPromotion || "none"}
                    onValueChange={handlePromotionChange}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Chọn khuyến mãi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không áp dụng</SelectItem>
                      {promotionList.map((promotion) => (
                        <SelectItem key={promotion._id} value={promotion._id}>
                          {promotion.name} ({promotion.discountPercentage}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {appliedPromotion && (
                  <div className="p-2 bg-green-100 rounded-md text-green-700 text-sm">
                    <p className="font-bold">{appliedPromotion.name}</p>
                    <p>{appliedPromotion.description}</p>
                    <p className="text-right font-bold">
                      Giảm: {appliedPromotion.discountPercentage}%
                    </p>
                  </div>
                )}

                <div className="flex justify-between font-bold text-lg text-pink-600">
                  <span>Tổng:</span>
                  <span>
                    {totalAmount?.toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    })}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span>💳 Thanh toán:</span>
                    <Select
                      defaultValue={PaymentMethod.Cash}
                      value={paymentMethod}
                      onValueChange={handlePaymentMethodChange}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Chọn phương thức" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PaymentMethod.Cash}>Cash</SelectItem>
                        <SelectItem value={PaymentMethod.BankTransfer}>
                          Bank Transfer
                        </SelectItem>
                        <SelectItem value={PaymentMethod.Momo}>Momo</SelectItem>
                        <SelectItem value={PaymentMethod.ZaloPay}>
                          ZaloPay
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {note && <p>📝 Ghi chú: {note}</p>}
                </div>
                <div className="border-t-2 border-dashed border-purple-400" />
                <div className="text-center">
                  <p className="text-purple-700 font-bold">Jozo - Vui Hết Ý!</p>
                  <p className="text-sm italic">Hẹn gặp lại nhé! 😉</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-6">
            <Button
              variant="outline"
              onClick={openFnbModal}
              className="text-base px-5 py-2 h-auto"
            >
              Thêm F&B
            </Button>
            <Button
              onClick={handleExtendSession}
              disabled={isPending}
              className="text-base px-5 py-2 h-auto"
            >
              Gia hạn
            </Button>
            <Button
              variant="outline"
              className="border-purple-400 text-purple-600 hover:bg-purple-200 text-base px-5 py-2 h-auto"
              onClick={() => printBill()}
            >
              <Printer className="w-4 h-4 mr-2" />
              In hóa đơn
            </Button>

            <Button
              variant="destructive"
              onClick={() => setIsConfirmEndOpen(true)}
              disabled={isPending || isSavingBill}
              className="text-base px-5 py-2 h-auto"
            >
              Kết thúc
            </Button>
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="text-base px-5 py-2 h-auto"
            >
              Đóng
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
              onClick={handleCompleteSession}
              disabled={isSavingBill || isPending}
            >
              {isSavingBill ? "Đang lưu hóa đơn..." : "Tiếp tục kết thúc"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FoodDrinkModal
        refetch={handleRefreshBill}
        isOpen={isFnbModalOpen}
        onClose={closeFnbModal}
        scheduleId={schedule._id}
      />
    </>
  );
};

export default ProcessInUseModal;
