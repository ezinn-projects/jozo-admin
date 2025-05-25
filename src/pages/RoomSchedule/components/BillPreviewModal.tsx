import { IRoom, IRoomSchedule } from "@/@types/Room";
import billAPis from "@/apis/bill.apis";
import roomsScheduleApis from "@/apis/roomSchedule.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaymentMethod, RoomStatus } from "@/constants/enum";
import { toast } from "@/hooks/use-toast";
import useAuth from "@/hooks/useAuth";
import { useGetStandardPromotions } from "@/hooks/promotion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import dayjs from "dayjs";
import { Printer, Gift, Clock } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Define bill interfaces
interface BillItem {
  description: string;
  price: number;
  quantity: number;
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

interface BillPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: IRoomSchedule;
  onConfirmEnd: () => void;
}

const BillPreviewModal: React.FC<BillPreviewModalProps> = ({
  isOpen,
  onClose,
  schedule,
  onConfirmEnd,
}) => {
  const [selectedPromotion, setSelectedPromotion] = useState<string>("");
  const [customEndTime, setCustomEndTime] = useState<string>("");

  const { data: standardPromotions } = useGetStandardPromotions();
  const promotionList = standardPromotions?.data.result || [];

  // Set default end time when modal opens
  useEffect(() => {
    if (isOpen) {
      setCustomEndTime(dayjs().format("HH:mm"));
    }
  }, [isOpen]);

  const { data: billData, refetch: refetchBill } = useQuery({
    queryKey: ["bill", schedule._id, selectedPromotion, customEndTime],
    queryFn: () =>
      billAPis.getBillByScheduleId(
        schedule._id,
        selectedPromotion || undefined,
        customEndTime || undefined
      ),
    enabled: isOpen,
  });

  const queryClient = useQueryClient();
  const rooms = queryClient.getQueryData<AxiosResponse<HTTPResponse<IRoom[]>>>([
    "rooms",
  ]);
  const room = rooms?.data.result?.find((room) => room._id === schedule.roomId);

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

  const { user } = useAuth();

  // Sử dụng useMutation để gọi API in hóa đơn
  const { mutate: printBill } = useMutation({
    mutationFn: () =>
      billAPis.printBill(schedule._id, {
        paymentMethod,
        actualEndTime: customEndTime
          ? dayjs().format("YYYY-MM-DD") + "T" + customEndTime + ":00"
          : dayjs(endTime).toISOString(),
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

  // Sử dụng useMutation để gọi API kết thúc phiên
  const { mutate: confirmEnd } = useMutation({
    mutationFn: () => {
      const actualEndTime = customEndTime
        ? dayjs().format("YYYY-MM-DD") + "T" + customEndTime + ":00"
        : dayjs().toISOString();

      return roomsScheduleApis.updateSchedule(schedule._id, {
        status: RoomStatus.Finished,
        endTime: actualEndTime,
      });
    },
    onSuccess: () => {
      onConfirmEnd();
      toast({
        title: "Success",
        description: "Phiên đã được kết thúc",
      });
      onClose();
    },
  });

  const handlePaymentMethodChange = (value: string) => {
    queryClient.setQueryData(
      ["bill", schedule._id],
      (oldData: AxiosResponse<HTTPResponse<IRoom[]>> | undefined) => {
        console.log("oldData", oldData);
        return {
          ...oldData,
          data: {
            ...oldData?.data,
            result: {
              ...oldData?.data.result,
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

  const getAppliedPromotion = () => {
    if (!selectedPromotion) return null;
    return promotionList.find((promo) => promo._id === selectedPromotion);
  };

  const appliedPromotion = getAppliedPromotion();

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomEndTime(e.target.value);
  };

  const handleApplyEndTime = () => {
    refetchBill();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg font-mono text-sm bg-gradient-to-br from-purple-100 to-pink-100">
        <DialogHeader>
          <DialogTitle className="text-center text-lg text-purple-700">
            🎉 Jozo Bill 🎉
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-gray-800">
          <div className="text-center">
            <p>
              Phòng: <span className="font-bold">{room?.roomName}</span>
            </p>
            <p>Ngày: {dayjs(createdAt).format("DD/MM/YYYY HH:mm")}</p>
            <p>
              Mã: {room?._id.slice(0, 2)}{" "}
              {dayjs(createdAt).format("HHmmDDMMYYYY")}
            </p>
          </div>
          <div className="border-t-2 border-dashed border-purple-400" />
          <div>
            <p>🎤 Bắt đầu: {dayjs(startTime).format("DD/MM/YYYY HH:mm")}</p>

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
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-purple-400 text-purple-600 hover:bg-purple-200"
                onClick={handleApplyEndTime}
              >
                Áp dụng
              </Button>
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
                  <span className="col-span-1 text-right">{item.quantity}</span>
                  <span className="col-span-3 text-right">
                    {item.price.toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    })}
                  </span>
                  <span className="col-span-3 text-right">
                    {(item.price * item.quantity).toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    })}
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
              <SelectTrigger className="w-[220px]">
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
                value={paymentMethod || ""}
                onValueChange={handlePaymentMethodChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Chọn phương thức" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PaymentMethod).map((method) => (
                    <SelectItem key={method} value={method}>
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {note && <p>📝 Ghi chú: {note}</p>}
          </div>
          <div className="border-t-2 border-dashed border-purple-400" />
          <div className="text-center">
            <p className="text-purple-700 font-bold">Jozo - Vui Hết Ý!</p>
            <p className="text-sm italic">Hẹn gặp lại nhé! 😉</p>
            <p className="text-sm italic text-gray-500">powered by Jozo</p>
          </div>
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <Button
            variant="outline"
            className="border-purple-400 text-purple-600 hover:bg-purple-200"
            onClick={onClose}
          >
            Thoát
          </Button>
          <Button
            variant="outline"
            className="border-purple-400 text-purple-600 hover:bg-purple-200"
            onClick={() => printBill()}
            // loading={isPending}
          >
            <Printer className="w-4 h-4 mr-2" />
            In
          </Button>
          <Button
            className="bg-pink-500 text-white hover:bg-pink-600"
            onClick={() => confirmEnd()}
          >
            Kết thúc
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillPreviewModal;
