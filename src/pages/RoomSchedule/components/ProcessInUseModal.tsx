import { OrderDetail } from "@/@types/FnbOrder";
import { IRoomSchedule } from "@/@types/Room";
import billAPis from "@/apis/bill.apis";
import fnbOrderApis from "@/apis/fnbOrder.apis";
import roomsScheduleApis from "@/apis/roomSchedule.api";
import MenuItemsModal from "@/components/modules/RoomSchedule/MenuItemsModal";
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
import { useGetMenuItems } from "@/hooks/use-menu-items";
import useAuth from "@/hooks/useAuth";
import { Clock, Gift, Minus, Plus, Printer } from "lucide-react";

// Define bill interfaces
interface BillItem {
  description: string;
  price: number;
  quantity: number;
  originalPrice?: number;
  discountName?: string;
  discountPercentage?: number;
  promotionId?: string;
  itemId?: string; // Thêm itemId để có thể cập nhật số lượng
  category?: string; // Thêm category để có thể cập nhật số lượng
}

interface BillData {
  _id?: string;
  totalAmount?: number;
  roomTotal?: number;
  fnbTotal?: number;
  items?: BillItem[];
  createdAt?: string | Date;
  paymentMethod?: string;
  note?: string;
  endTime?: string | Date;
  startTime?: string | Date;
}

// Interface cho bill response từ API
interface BillResponse {
  items?: BillItem[];
  totalAmount?: number;
  roomTotal?: number;
  fnbTotal?: number;
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
  const [isMenuItemsModalOpen, setIsMenuItemsModalOpen] = useState(false);
  const [isConfirmEndOpen, setIsConfirmEndOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<string>("");
  const [customEndTime, setCustomEndTime] = useState<string>("");
  const [customStartTime, setCustomStartTime] = useState<string>("");
  const { data: menuItems } = useGetMenuItems();
  const { user } = useAuth();
  const { data: standardPromotions } = useGetStandardPromotions();
  const promotionList = standardPromotions?.data.result || [];
  const queryClient = useQueryClient();

  const openMenuItemsModal = () => setIsMenuItemsModalOpen(true);
  const closeMenuItemsModal = () => setIsMenuItemsModalOpen(false);

  // Set default end time when modal opens
  useEffect(() => {
    if (isOpen) {
      setCustomEndTime(dayjs().format("HH:mm"));
      setCustomStartTime(dayjs(schedule.startTime).format("HH:mm"));
    }
  }, [isOpen, schedule.startTime]);

  const getAppliedPromotion = () => {
    if (!selectedPromotion) return null;
    return promotionList.find((promo) => promo._id === selectedPromotion);
  };

  const appliedPromotion = getAppliedPromotion();

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

  // Mutation để cập nhật số lượng item
  const { mutate: updateItemQuantity, isPending: isUpdatingQuantity } =
    useMutation({
      mutationFn: async ({
        itemId,
        quantity,
        category,
      }: {
        itemId: string;
        quantity: number;
        category: string;
      }) => {
        console.log("Mutation function called with:", {
          itemId,
          quantity,
          category,
        });
        if (!schedule._id || !user?._id) {
          console.log("Missing schedule._id or user._id:", {
            scheduleId: schedule._id,
            userId: user?._id,
          });
          return;
        }
        console.log("Calling fnbOrderApis.upsertItem with:", {
          roomScheduleId: schedule._id,
          itemId,
          quantity,
          category,
          createdBy: user._id,
        });
        await fnbOrderApis.upsertItem({
          roomScheduleId: schedule._id,
          itemId,
          quantity,
          category,
          createdBy: user._id,
        });
      },
      onMutate: async ({ itemId, quantity }) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({
          queryKey: [
            "bill",
            schedule._id,
            selectedPromotion,
            customEndTime,
            customStartTime,
          ],
        });

        // Snapshot the previous value
        const previousBillData = queryClient.getQueryData([
          "bill",
          schedule._id,
          selectedPromotion,
          customEndTime,
          customStartTime,
        ]);

        // Optimistically update to the new value
        queryClient.setQueryData(
          [
            "bill",
            schedule._id,
            selectedPromotion,
            customEndTime,
            customStartTime,
          ],
          (
            old:
              | {
                  data?: {
                    result?: {
                      items?: BillItem[];
                      roomTotal?: number;
                      fnbTotal?: number;
                      totalAmount?: number;
                    };
                  };
                }
              | undefined
          ) => {
            if (!old?.data?.result?.items) return old;

            const updatedItems = old.data.result.items.map((item: BillItem) =>
              item.itemId === itemId ? { ...item, quantity } : item
            );

            // Recalculate totals
            const newFnBTotal = updatedItems.reduce(
              (sum: number, item: BillItem) => sum + item.price * item.quantity,
              0
            );

            const newTotalAmount =
              (old.data.result.roomTotal || 0) + newFnBTotal;

            return {
              ...old,
              data: {
                ...old.data,
                result: {
                  ...old.data.result,
                  items: updatedItems,
                  fnbTotal: newFnBTotal,
                  totalAmount: newTotalAmount,
                },
              },
            };
          }
        );

        return { previousBillData };
      },
      onError: (_err, _variables, context) => {
        // If the mutation fails, use the context returned from onMutate to roll back
        if (context?.previousBillData) {
          queryClient.setQueryData(
            [
              "bill",
              schedule._id,
              selectedPromotion,
              customEndTime,
              customStartTime,
            ],
            context.previousBillData
          );
        }
        toast({
          title: "Lỗi",
          description: "Không thể cập nhật số lượng",
          variant: "destructive",
        });
      },
      onSuccess: () => {
        // Invalidate and refetch
        queryClient.invalidateQueries({
          queryKey: [
            "bill",
            schedule._id,
            selectedPromotion,
            customEndTime,
            customStartTime,
          ],
        });
      },
    });

  // Bill data query - gọi với thời gian thực tế ngay từ đầu
  const { data: billData } = useQuery({
    queryKey: [
      "bill",
      schedule._id,
      selectedPromotion,
      customEndTime,
      customStartTime,
    ],
    queryFn: () => {
      // Convert custom times to ISO strings
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

      return billAPis.getBillByScheduleId(
        schedule._id,
        selectedPromotion || undefined,
        actualEndTime,
        actualStartTime
      );
    },
    enabled: isOpen && !!customEndTime && !!customStartTime,
  });

  // Query để lấy order detail để có itemId và category
  const { data: orderDetailData } = useQuery<OrderDetail | undefined>({
    queryKey: ["fnbOrderDetail", schedule._id],
    queryFn: () =>
      schedule._id
        ? fnbOrderApis
            .getFnbOrderDetail(schedule._id)
            .then((res) => res.data.result as OrderDetail)
        : Promise.resolve(undefined),
    enabled: isOpen && !!schedule._id,
  });

  // Mapping items với itemId và category từ orderDetailData
  const itemsWithDetails = React.useMemo(() => {
    console.log("Mapping items - billData:", billData?.data.result);
    console.log("Mapping items - orderDetailData:", orderDetailData);
    console.log("Mapping items - menuItems:", menuItems);

    if (!billData?.data.result) {
      console.log("Missing billData");
      return (billData?.data.result as BillResponse)?.items || [];
    }

    const orderItems = orderDetailData
      ? [
          ...(orderDetailData.items?.drinks || []),
          ...(orderDetailData.items?.snacks || []),
        ]
      : [];
    console.log("Order items:", orderItems);

    const billItems = (billData.data.result as BillResponse)?.items || [];
    console.log("Bill items:", billItems);

    return billItems.map((item: BillItem) => {
      // Thử tìm trong orderDetailData trước
      let orderItem = orderItems.find(
        (orderItem) =>
          orderItem.name === item.description ||
          orderItem.itemId === item.itemId
      );

      // Nếu không tìm thấy trong orderDetailData, thử tìm trong menuItems
      if (!orderItem && menuItems) {
        const menuItem = menuItems.find(
          (menuItem) => menuItem.name === item.description
        );
        if (menuItem) {
          orderItem = {
            itemId: menuItem._id,
            category: menuItem.category,
            name: menuItem.name,
            price: menuItem.price,
            quantity: item.quantity,
          };
        }
      }

      const mappedItem = {
        ...item,
        itemId: orderItem?.itemId || item.itemId,
        category: orderItem?.category || item.category,
      };

      console.log("Mapped item:", mappedItem);
      return mappedItem;
    });
  }, [billData?.data.result, orderDetailData, menuItems]);

  // Sử dụng trực tiếp dữ liệu từ API vì backend đã tính toán promotion
  const billResult = (billData?.data.result || {}) as BillData;
  const {
    totalAmount,
    roomTotal,
    items = itemsWithDetails, // Sử dụng itemsWithDetails thay vì items
    createdAt,
    fnbTotal,
    paymentMethod = PaymentMethod.Cash,
    note,
    endTime,
    startTime,
  } = billResult;

  // Debug: Log items khi thay đổi
  useEffect(() => {
    console.log("Items changed:", items);
  }, [items]);

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
    // Query sẽ tự động refetch khi selectedPromotion thay đổi
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomEndTime(e.target.value);
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomStartTime(e.target.value);
  };

  // Hàm xử lý tăng/giảm số lượng item
  const handleQuantityChange = (
    itemId: string,
    currentQuantity: number,
    change: number,
    category: string
  ) => {
    console.log("handleQuantityChange called with:", {
      itemId,
      currentQuantity,
      change,
      category,
    });
    const newQuantity = Math.max(0, currentQuantity + change);
    if (newQuantity === currentQuantity) return;

    console.log("Calling updateItemQuantity with:", {
      itemId,
      quantity: newQuantity,
      category,
    });
    updateItemQuantity({
      itemId,
      quantity: newQuantity,
      category,
    });
  };

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
                  <span className="col-span-4">Tên</span>
                  <span className="col-span-2 text-center">SL</span>
                  <span className="col-span-3 text-right">Đơn Giá</span>
                  <span className="col-span-3 text-right">Thành Tiền</span>
                </div>
                {items.map((item: BillItem, index: number) => (
                  <div key={index}>
                    <div className="grid grid-cols-12 gap-1 items-center">
                      <span className="col-span-4 truncate">
                        {item.description}
                      </span>
                      <div className="col-span-2 flex items-center justify-center gap-1">
                        {item.description
                          .toLowerCase()
                          .includes("phi dich vu thu am") ? (
                          // Chỉ hiển thị số lượng cho phí dịch vụ thu âm
                          <span className="min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                        ) : (
                          // Hiển thị nút + và - cho các item khác
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                console.log(
                                  "Minus button clicked for item:",
                                  item
                                );
                                console.log(
                                  "itemId:",
                                  item.itemId,
                                  "category:",
                                  item.category
                                );
                                if (item.itemId && item.category) {
                                  handleQuantityChange(
                                    item.itemId,
                                    item.quantity,
                                    -1,
                                    item.category
                                  );
                                } else if (menuItems) {
                                  // Fallback: tìm trong menuItems
                                  const menuItem = menuItems.find(
                                    (menuItem) =>
                                      menuItem.name === item.description
                                  );
                                  if (menuItem) {
                                    console.log(
                                      "Using menuItem for minus:",
                                      menuItem
                                    );
                                    handleQuantityChange(
                                      menuItem._id,
                                      item.quantity,
                                      -1,
                                      menuItem.category
                                    );
                                  } else {
                                    console.log(
                                      "Missing itemId or category for item:",
                                      item
                                    );
                                  }
                                } else {
                                  console.log(
                                    "Missing itemId or category for item:",
                                    item
                                  );
                                }
                              }}
                              disabled={
                                item.quantity <= 0 || isUpdatingQuantity
                              }
                              className="w-6 h-6 p-0 text-xs"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                console.log(
                                  "Plus button clicked for item:",
                                  item
                                );
                                console.log(
                                  "itemId:",
                                  item.itemId,
                                  "category:",
                                  item.category
                                );
                                if (item.itemId && item.category) {
                                  handleQuantityChange(
                                    item.itemId,
                                    item.quantity,
                                    1,
                                    item.category
                                  );
                                } else if (menuItems) {
                                  // Fallback: tìm trong menuItems
                                  const menuItem = menuItems.find(
                                    (menuItem) =>
                                      menuItem.name === item.description
                                  );
                                  if (menuItem) {
                                    console.log(
                                      "Using menuItem for plus:",
                                      menuItem
                                    );
                                    handleQuantityChange(
                                      menuItem._id,
                                      item.quantity,
                                      1,
                                      menuItem.category
                                    );
                                  } else {
                                    console.log(
                                      "Missing itemId or category for item:",
                                      item
                                    );
                                  }
                                } else {
                                  console.log(
                                    "Missing itemId or category for item:",
                                    item
                                  );
                                }
                              }}
                              disabled={isUpdatingQuantity}
                              className="w-6 h-6 p-0 text-xs"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
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
                <span>Khuyến mãi:</span>
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

              {/* Hiển thị chi tiết tính toán giá */}
              <div className="space-y-2 border-t-2 border-dashed border-purple-400 pt-2">
                {/* Chi tiết từng khoản */}
                {roomTotal && roomTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tiền phòng:</span>
                    <span className="text-gray-800">
                      {roomTotal.toLocaleString("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      })}
                    </span>
                  </div>
                )}

                {/* Tính toán giá gốc */}
                {(() => {
                  const originalTotal = (roomTotal || 0) + (fnbTotal || 0);
                  const finalTotal = totalAmount || 0;
                  const discountAmount = originalTotal - finalTotal;

                  return (
                    <>
                      {/* Giảm giá (nếu có) */}
                      {appliedPromotion && discountAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">
                            Giảm {appliedPromotion.name} (
                            {appliedPromotion.discountPercentage}%):
                          </span>
                          <span className="text-green-600 font-medium">
                            -
                            {discountAmount.toLocaleString("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            })}
                          </span>
                        </div>
                      )}

                      {/* Giá cuối cùng */}
                      <div className="flex justify-between font-bold text-lg text-pink-600 border-t border-gray-300 pt-2">
                        <span>Tổng cộng:</span>
                        <span>
                          {finalTotal.toLocaleString("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          })}
                        </span>
                      </div>
                    </>
                  );
                })()}
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

          <div className="flex flex-wrap gap-4 mt-6">
            <Button
              variant="outline"
              onClick={openMenuItemsModal}
              className="text-base px-5 py-2 h-auto"
            >
              Thêm Menu Items
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

      <MenuItemsModal
        isOpen={isMenuItemsModalOpen}
        onClose={closeMenuItemsModal}
        menuItems={menuItems || []}
        roomId={schedule.roomId}
        scheduleId={schedule._id}
        createdBy={user?._id || ""}
      />
    </>
  );
};

export default ProcessInUseModal;
