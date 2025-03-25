import { IRoom, IRoomSchedule } from "@/@types/Room";
import billAPis from "@/apis/bill.apis";
import roomApis from "@/apis/room.apis";
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
import { PaymentMethod, RoomStatus, RoomType } from "@/constants/enum";
import { toast } from "@/hooks/use-toast";
import useAuth from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import dayjs from "dayjs";
import { Printer } from "lucide-react";
import React from "react";

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
  const { data: billData } = useQuery({
    queryKey: ["bill", schedule._id],
    queryFn: () => billAPis.getBillByScheduleId(schedule._id),
    enabled: isOpen,
  });

  const queryClient = useQueryClient();
  const rooms = queryClient.getQueryData<AxiosResponse<HTTPResponse<IRoom[]>>>([
    "rooms",
  ]);
  const room = rooms?.data.result?.find((room) => room._id === schedule.roomId);

  const {
    totalAmount,
    items = [],
    createdAt,
    paymentMethod = PaymentMethod.Cash,
    note,
    endTime,
    startTime,
  } = billData?.data.result || {};

  const { user } = useAuth();

  // Sử dụng useMutation để gọi API in hóa đơn
  const { mutate: printBill } = useMutation({
    mutationFn: () =>
      billAPis.printBill(schedule._id, {
        paymentMethod,
        actualEndTime: dayjs(endTime).toISOString(),
      }),
    onSuccess: (response) => {
      if (!response?.data) return;

      // // Convert arraybuffer to blob
      // const blob = new Blob([response.data], { type: "application/pdf" });
      // const url = URL.createObjectURL(blob);

      // // Create hidden iframe for printing
      // const printFrame = document.createElement("iframe");
      // printFrame.style.display = "none";
      // printFrame.src = url;

      // // Add to DOM
      // document.body.appendChild(printFrame);

      // // Wait for PDF to load
      // printFrame.onload = () => {
      //   try {
      //     // Trigger print dialog
      //     printFrame.contentWindow?.print();
      //   } catch (error) {
      //     console.error("Lỗi khi in:", error);
      //   } finally {
      //     // Cleanup
      //     setTimeout(() => {
      //       document.body.removeChild(printFrame);
      //       window.URL.revokeObjectURL(url);
      //     }, 30000);
      //   }
      // };

      toast({
        title: "Success",
        description: "Hóa đơn đã được in",
      });
      onClose();
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
    mutationFn: () =>
      roomApis.updateRoom({
        _id: schedule.roomId,
        status: RoomStatus.Available,
        roomName: room?.roomName || "",
        roomType: room?.roomType as RoomType,
        description: room?.description || "",
        ...room,
      }),
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
            {endTime && (
              <p>🎶 Kết thúc: {dayjs(endTime).format("DD/MM/YYYY HH:mm")}</p>
            )}
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
            {items.map((item, index: number) => (
              <div key={index} className="grid grid-cols-12 gap-1">
                <span className="col-span-5 truncate">{item.description}</span>
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
            ))}
          </div>
          <div className="border-t-2 border-dashed border-purple-400" />
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
