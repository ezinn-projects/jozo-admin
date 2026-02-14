import { OrderDetail } from "@/@types/FnbOrder";
import { BillGift } from "@/@types/Gift";
import { IRoomSchedule } from "@/@types/Room";
import billAPis from "@/apis/bill.apis";
import fnbOrderApis from "@/apis/fnbOrder.apis";
import roomsScheduleApis, { ICreateRoomScheduleRequest } from "@/apis/roomSchedule.api";
import MenuItemsModal from "@/components/modules/RoomSchedule/MenuItemsModal";
import ClaimGiftModal from "./ClaimGiftModal";
import MemberInfoModal from "./MemberInfoModal";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useGetStandardPromotions } from "@/hooks/promotion";
import { useGetMenuItems } from "@/hooks/use-menu-items";
import useAuth from "@/hooks/useAuth";
import { Clock, Gift, Minus, Plus, Printer, User } from "lucide-react";
import { Switch } from "@/components/ui/switch";

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
  gift?: BillGift;
  giftDiscountAmount?: number;
  freeHourPromotion?: {
    freeMinutesApplied: number;
    freeAmount: number;
  };
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
  gift?: BillGift;
  giftDiscountAmount?: number;
  freeHourPromotion?: {
    freeMinutesApplied: number;
    freeAmount: number;
  };
}

interface BillResultWithNote extends BillResponse {
  note?: string;
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
  const [isClaimGiftModalOpen, setIsClaimGiftModalOpen] = useState(false);
  const [isMemberInfoModalOpen, setIsMemberInfoModalOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<string>("");
  const [customEndTime, setCustomEndTime] = useState<string>("");
  const [customStartTime, setCustomStartTime] = useState<string>("");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState<string>("");
  const [customerPhoneValue, setCustomerPhoneValue] = useState<string>("");
  const [applyFreeHourPromo, setApplyFreeHourPromo] = useState<boolean>(false);
  const [isGiftEnabled, setIsGiftEnabled] = useState<boolean>(
    schedule.giftEnabled || false
  );
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
      setApplyFreeHourPromo(schedule.applyFreeHourPromo || false);
      setIsGiftEnabled(schedule.giftEnabled || false);
      setCustomerPhoneValue(schedule.customerPhone || "");
    }
  }, [
    isOpen,
    schedule.startTime,
    schedule.applyFreeHourPromo,
    schedule.giftEnabled,
    schedule.customerPhone,
  ]);

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

  // Mutation riêng để cập nhật note
  const { mutate: updateNote, isPending: isUpdatingNote } = useMutation({
    mutationFn: (note: string) =>
      roomsScheduleApis.updateSchedule(schedule._id, { note }),
    onSuccess: () => {
      refetchSchedules?.();
    },
    onError: (error) => {
      console.error("Error updating note:", error);
      toast({
        title: "Error",
        description: "Không thể cập nhật ghi chú",
        variant: "destructive",
      });
    },
  });

  // Mutation để cập nhật applyFreeHourPromo
  const { mutate: updateFreeHourPromo, isPending: isUpdatingFreeHourPromo } =
    useMutation({
      mutationFn: (applyFreeHourPromo: boolean) =>
        roomsScheduleApis.updateSchedule(schedule._id, {
          applyFreeHourPromo,
        }),
      onSuccess: (_, applyFreeHourPromo) => {
        refetchSchedules?.();
        // Refetch bill để cập nhật dữ liệu khuyến mãi giờ miễn phí
        queryClient.invalidateQueries({
          queryKey: [
            "bill",
            schedule._id,
            selectedPromotion,
            customEndTime,
            customStartTime,
          ],
        });
        toast({
          title: "Success",
          description: applyFreeHourPromo
            ? "Đã áp dụng khuyến mãi giờ miễn phí"
            : "Đã tắt khuyến mãi giờ miễn phí",
        });
      },
      onError: (error) => {
        console.error("Error updating free hour promo:", error);
        toast({
          title: "Error",
          description: "Không thể cập nhật khuyến mãi giờ miễn phí",
          variant: "destructive",
        });
        // Rollback checkbox state on error
        setApplyFreeHourPromo(!applyFreeHourPromo);
      },
    });

  // Mutation để bật/tắt quyền nhận quà
  const { mutate: updateGiftEnabled, isPending: isUpdatingGiftEnabled } =
    useMutation({
      mutationFn: (giftEnabled: boolean) =>
        roomsScheduleApis.updateSchedule(schedule._id, { giftEnabled }),
      onMutate: async (giftEnabled) => {
        const previous = isGiftEnabled;
        setIsGiftEnabled(giftEnabled);
        return { previous };
      },
      onSuccess: (_, giftEnabled) => {
        refetchSchedules?.();
        toast({
          title: "Success",
          description: giftEnabled
            ? "Đã cho phép nhận quà"
            : "Đã tắt quyền nhận quà",
        });
      },
      onError: (_error, _giftEnabled, context) => {
        if (context?.previous !== undefined) {
          setIsGiftEnabled(context.previous);
        }
        toast({
          title: "Error",
          description: "Không thể cập nhật quyền nhận quà",
          variant: "destructive",
        });
      },
    });

  // Mutation để cập nhật customerPhone
  const { mutate: updateCustomerPhone, isPending: isUpdatingCustomerPhone } =
    useMutation({
      mutationFn: (customerPhone: string) =>
        roomsScheduleApis.updateSchedule(schedule._id, { 
          customerPhone 
        } as Partial<ICreateRoomScheduleRequest>),
      onSuccess: () => {
        refetchSchedules?.();
        toast({
          title: "Success",
          description: "Đã cập nhật số điện thoại khách hàng",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Không thể cập nhật số điện thoại",
          variant: "destructive",
        });
      },
    });

  // Mutation để cập nhật số lượng item (dùng add/remove)
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
        if (!schedule._id || !user?._id) return;

        // Get current quantity
        const currentQuantity =
          orderDetailData?.items?.drinks?.find((item) => item.itemId === itemId)
            ?.quantity ||
          orderDetailData?.items?.snacks?.find((item) => item.itemId === itemId)
            ?.quantity ||
          0;

        const diff = quantity - currentQuantity;

        if (diff === 0) return; // Không có thay đổi

        // Tạo payload đúng format API mới
        // Kiểm tra cả "drink" và "drinks", "snack" và "snacks"
        const isDrinks = category === "drinks" || category === "drink";
        const payload = {
          order: {
            ...(isDrinks
              ? { drinks: { [itemId]: Math.abs(diff) } }
              : { snacks: { [itemId]: Math.abs(diff) } }),
          },
          createdBy: user._id,
        };

        if (diff > 0) {
          await fnbOrderApis.addItemToOrder(schedule._id, payload);
        } else if (diff < 0) {
          await fnbOrderApis.removeItemFromOrder(schedule._id, payload);
        }
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

        // Cancel fnbOrderDetail queries
        await queryClient.cancelQueries({
          queryKey: ["fnbOrderDetail", schedule._id],
        });

        // Snapshot the previous values
        const previousBillData = queryClient.getQueryData([
          "bill",
          schedule._id,
          selectedPromotion,
          customEndTime,
          customStartTime,
        ]);

        const previousOrderData = queryClient.getQueryData([
          "fnbOrderDetail",
          schedule._id,
        ]);

        // Get current quantity from orderDetailData
        const currentQuantity =
          orderDetailData?.items?.drinks?.find((item) => item.itemId === itemId)
            ?.quantity ||
          orderDetailData?.items?.snacks?.find((item) => item.itemId === itemId)
            ?.quantity ||
          0;

        const quantityDiff = quantity - currentQuantity;

        // Optimistically update bill data
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

        // Optimistically update orderDetailData
        queryClient.setQueryData(
          ["fnbOrderDetail", schedule._id],
          (old: OrderDetail | undefined) => {
            if (!old) return old;

            const newDrinks = old.items.drinks.map((item) =>
              item.itemId === itemId ? { ...item, quantity } : item
            );
            const newSnacks = old.items.snacks.map((item) =>
              item.itemId === itemId ? { ...item, quantity } : item
            );

            return {
              ...old,
              items: {
                drinks: newDrinks,
                snacks: newSnacks,
              },
            };
          }
        );

        // Optimistically update menuItems inventory
        queryClient.setQueriesData(
          { queryKey: ["menuItems"] },
          (old: { data?: { result?: unknown[] } } | undefined) => {
            if (!old?.data?.result) return old;
            return {
              ...old,
              data: {
                ...old.data,
                result: old.data.result.map((item: unknown) => {
                  const menuItem = item as {
                    _id: string;
                    inventory?: { quantity?: number };
                  };
                  if (menuItem._id === itemId) {
                    return {
                      ...(item as Record<string, unknown>),
                      inventory: {
                        ...menuItem.inventory,
                        quantity: Math.max(
                          0,
                          (menuItem.inventory?.quantity || 0) - quantityDiff
                        ),
                      },
                    };
                  }
                  return item;
                }),
              },
            };
          }
        );

        return { previousBillData, previousOrderData, currentQuantity };
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
        if (context?.previousOrderData) {
          queryClient.setQueryData(
            ["fnbOrderDetail", schedule._id],
            context.previousOrderData
          );
        }
        // Rollback menuItems inventory
        if (context?.currentQuantity !== undefined) {
          const quantityDiff = _variables.quantity - context.currentQuantity;
          queryClient.setQueriesData(
            { queryKey: ["menuItems"] },
            (old: { data?: { result?: unknown[] } } | undefined) => {
              if (!old?.data?.result) return old;
              return {
                ...old,
                data: {
                  ...old.data,
                  result: old.data.result.map((item: unknown) => {
                    const menuItem = item as {
                      _id: string;
                      inventory?: { quantity?: number };
                    };
                    if (menuItem._id === _variables.itemId) {
                      return {
                        ...(item as Record<string, unknown>),
                        inventory: {
                          ...menuItem.inventory,
                          quantity: Math.max(
                            0,
                            (menuItem.inventory?.quantity || 0) + quantityDiff
                          ),
                        },
                      };
                    }
                    return item;
                  }),
                },
              };
            }
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
        queryClient.invalidateQueries({
          queryKey: ["fnbOrderDetail", schedule._id],
        });
        // Refetch menuItems để đảm bảo inventory được cập nhật từ server
        queryClient.invalidateQueries({ queryKey: ["menuItems"] });
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

  // Set note value when bill data changes
  useEffect(() => {
    if (billData?.data.result && "note" in billData.data.result) {
      setNoteValue((billData.data.result as BillResultWithNote).note || "");
    }
  }, [billData?.data.result]);

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
    gift,
    freeHourPromotion,
    giftDiscountAmount = 0,
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
      customerPhone: customerPhoneValue || schedule.customerPhone,
      paymentMethod: paymentMethod,
      startTime: actualStartTime,
      endTime: actualEndTime,
      note: noteValue || note,
      promotionId: selectedPromotion || undefined,
    };

    // Save bill trước khi update schedule status
    saveBillMutation(billToSave, {
      onSuccess: () => {
        // Invalidate pending-gifts query để refresh member info
        if (customerPhoneValue) {
          queryClient.invalidateQueries({
            queryKey: ["pending-gifts", customerPhoneValue],
          });
        }

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

  // Functions để xử lý edit note
  const handleEditNote = () => {
    setIsEditingNote(true);
  };

  const handleSaveNote = () => {
    // Cập nhật note trong query cache

    // Gọi API để cập nhật note trong room schedule
    updateNote(noteValue, {
      onSuccess: () => {
        queryClient.setQueryData(
          [
            "bill",
            schedule._id,
            selectedPromotion,
            customEndTime,
            customStartTime,
          ],
          (oldData: AxiosResponse<HTTPResponse<BillResponse>>) => {
            console.log("oldData", oldData.data.result);
            if (!oldData) return oldData;

            const updatedData: AxiosResponse<HTTPResponse<BillResponse>> = {
              ...oldData,
              data: {
                ...oldData.data,
                result: {
                  ...oldData.data.result,
                  note: noteValue,
                },
              },
            };

            console.log("updatedData", updatedData);

            return updatedData;
          }
        );
        toast({
          title: "Success",
          description: "Ghi chú đã được cập nhật",
        });
      },
    });

    setIsEditingNote(false);
    toast({
      title: "Success",
      description: "Ghi chú đã được cập nhật",
    });
  };

  const handleCancelEditNote = () => {
    const currentNote =
      billData?.data.result && "note" in billData.data.result
        ? (billData.data.result as BillResultWithNote).note
        : "";
    setNoteValue(currentNote || "");
    setIsEditingNote(false);
  };

  // Hàm xử lý tăng/giảm số lượng item
  const handleQuantityChange = (
    itemId: string,
    currentQuantity: number,
    change: number,
    category: string
  ) => {
    const newQuantity = Math.max(0, currentQuantity + change);
    if (newQuantity === currentQuantity) return;

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
        <DialogContent className="max-w-5xl w-[95vw] max-h-[100vh] sm:max-h-[94vh] p-0 flex flex-col overflow-y-auto">
          <div
            className="overflow-y-auto flex-1 px-4 sm:px-6 pt-4 sm:pt-6"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <DialogHeader className="pb-4">
              <DialogTitle className="text-lg sm:text-xl">
                Session Management
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Session started at {dayjs(schedule.startTime).format("HH:mm")}{" "}
                and end at {dayjs(schedule.endTime).format("HH:mm")}.<br />
                You can choose to end or extend the current session.
              </DialogDescription>
            </DialogHeader>

            {/* Membership & Quà tặng */}
            <div className="mb-4">
              <div
                className={`${
                  gift || isGiftEnabled ? "bg-gradient-to-r from-blue-50 to-pink-50" : "bg-blue-50"
                } p-4 rounded-lg border ${
                  gift || isGiftEnabled ? "border-pink-200" : "border-blue-200"
                }`}
              >
                <div className="space-y-3">
                  {/* Phone Input */}
                  <div>
                    <Label htmlFor="customer-phone" className="text-sm font-medium mb-2 block flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      Số điện thoại thành viên
                    </Label>
                    <Input
                      id="customer-phone"
                      type="tel"
                      placeholder="Nhập số điện thoại..."
                      value={customerPhoneValue}
                      onChange={(e) => setCustomerPhoneValue(e.target.value)}
                      disabled={isUpdatingCustomerPhone}
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Nhập số điện thoại để tích điểm và quản lý quà tặng
                    </p>
                  </div>

                  {/* Gift Status & Switch */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <Gift
                        className={`w-4 h-4 ${
                          gift || isGiftEnabled
                            ? "text-pink-500"
                            : "text-gray-500"
                        }`}
                      />
                      <span className="text-sm font-medium">
                        Trạng thái quà tặng:
                      </span>
                      <span
                        className={`text-sm ${
                          gift || isGiftEnabled
                            ? "text-pink-600 font-semibold"
                            : "text-gray-600"
                        }`}
                      >
                        {gift
                          ? "Đã nhận quà"
                          : isGiftEnabled
                          ? "Được phép nhận quà"
                          : "Không được nhận quà"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm">Allow Gift</span>
                      <Switch
                        checked={isGiftEnabled}
                        onCheckedChange={(checked) =>
                          updateGiftEnabled(checked === true)
                        }
                        disabled={isUpdatingGiftEnabled}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {customerPhoneValue && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isUpdatingCustomerPhone}
                        onClick={() => {
                          if (customerPhoneValue !== schedule.customerPhone) {
                            updateCustomerPhone(customerPhoneValue, {
                              onSuccess: () => setIsMemberInfoModalOpen(true),
                            });
                          } else {
                            setIsMemberInfoModalOpen(true);
                          }
                        }}
                        className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-100"
                      >
                        <User className="w-4 h-4 mr-1" />
                        Xem thông tin
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isUpdatingCustomerPhone}
                        onClick={() => {
                          if (customerPhoneValue !== schedule.customerPhone) {
                            updateCustomerPhone(customerPhoneValue, {
                              onSuccess: () => setIsClaimGiftModalOpen(true),
                            });
                          } else {
                            setIsClaimGiftModalOpen(true);
                          }
                        }}
                        className="flex-1 border-pink-300 text-pink-600 hover:bg-pink-50"
                      >
                        <Gift className="w-4 h-4 mr-1" />
                        Phục vụ quà tặng
                      </Button>
                    </div>
                  )}

                  {/* Gift Details */}
                  {gift && (
                    <div className="pt-2 border-t border-pink-200 space-y-1">
                      <div className="text-sm">
                        <span className="font-medium">Tên quà:</span>{" "}
                        <span className="text-pink-700">{gift.name}</span>
                      </div>
                      {gift.type === "discount" && gift.discountPercentage && (
                        <div className="text-sm">
                          <span className="font-medium">Giảm giá:</span>{" "}
                          <span className="text-green-600 font-semibold">
                            {gift.discountPercentage}%
                          </span>
                        </div>
                      )}
                      {gift.type === "snacks_drinks" &&
                        gift.items &&
                        gift.items.length > 0 && (
                          <div className="text-sm space-y-1">
                            <span className="font-medium">
                              Items trong quà:
                            </span>
                            <ul className="list-disc list-inside ml-2 space-y-0.5">
                              {gift.items.map((item, index) => (
                                <li key={index} className="text-purple-600">
                                  {item.name} x{item.quantity}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bill Preview Section */}
            <div className="mt-4 p-3 sm:p-4 border rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 font-mono text-xs sm:text-sm">
              <h4 className="text-center text-lg text-purple-700 font-bold mb-2">
                🎉 Jozo Bill 🎉
              </h4>

              <div className="space-y-2 text-gray-800">
                <div className="text-center">
                  <p className="text-xs sm:text-sm">
                    Phòng: <span className="font-bold">{room?.roomName}</span>
                  </p>
                  <p className="text-xs sm:text-sm">
                    Ngày:{" "}
                    {dayjs(createdAt || new Date()).format("DD/MM/YYYY HH:mm")}
                  </p>
                  <p className="text-xs sm:text-sm break-all">
                    Mã: {room?._id.slice(0, 2)}{" "}
                    {dayjs(createdAt || new Date()).format("HHmmDDMMYYYY")}
                  </p>
                </div>
                <div className="border-t-2 border-dashed border-purple-400" />
                <div>
                  {/* Custom Start Time Input */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 my-2">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Clock className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <Label
                        htmlFor="start-time"
                        className="text-xs sm:text-sm whitespace-nowrap"
                      >
                        Thời gian bắt đầu:
                      </Label>
                    </div>
                    <Input
                      id="start-time"
                      type="time"
                      value={customStartTime}
                      onChange={handleStartTimeChange}
                      className="w-full sm:w-36 h-9 sm:h-8 text-sm"
                    />
                  </div>

                  {/* Custom End Time Input */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 my-2">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Clock className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <Label
                        htmlFor="end-time"
                        className="text-xs sm:text-sm whitespace-nowrap"
                      >
                        Thời gian kết thúc:
                      </Label>
                    </div>
                    <Input
                      id="end-time"
                      type="time"
                      value={customEndTime}
                      onChange={handleEndTimeChange}
                      className="w-full sm:w-36 h-9 sm:h-8 text-sm"
                    />
                  </div>

                  <p className="text-xs sm:text-sm">
                    Người tạo: <span className="font-bold">{user?.name}</span>
                  </p>
                </div>
                <div className="border-t-2 border-dashed border-purple-400" />

                <div>
                  {/* Desktop Layout */}
                  <div className="hidden sm:block">
                    <div className="grid grid-cols-12 font-bold text-purple-600 gap-1 text-xs sm:text-sm">
                      <span className="col-span-4">Tên</span>
                      <span className="col-span-2 text-center">SL</span>
                      <span className="col-span-3 text-right">Đơn Giá</span>
                      <span className="col-span-3 text-right">Thành Tiền</span>
                    </div>
                    {items.map((item: BillItem, index: number) => (
                      <div key={index}>
                        <div className="grid grid-cols-12 gap-1 items-center">
                          <span className="col-span-4 truncate text-xs sm:text-sm">
                            {item.description}
                          </span>
                          <div className="col-span-2 flex items-center justify-center gap-1">
                            {item.description
                              .toLowerCase()
                              .includes("phi dich vu thu am") ? (
                              <span className="min-w-[2rem] text-center text-xs sm:text-sm">
                                {item.quantity}
                              </span>
                            ) : (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (item.itemId && item.category) {
                                      handleQuantityChange(
                                        item.itemId,
                                        item.quantity,
                                        -1,
                                        item.category
                                      );
                                    } else if (menuItems) {
                                      const menuItem = menuItems.find(
                                        (menuItem) =>
                                          menuItem.name === item.description
                                      );
                                      if (menuItem) {
                                        handleQuantityChange(
                                          menuItem._id,
                                          item.quantity,
                                          -1,
                                          menuItem.category
                                        );
                                      }
                                    }
                                  }}
                                  disabled={
                                    item.quantity <= 0 || isUpdatingQuantity
                                  }
                                  className="w-6 h-6 p-0 text-xs"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="min-w-[2rem] text-center text-xs sm:text-sm">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (item.itemId && item.category) {
                                      handleQuantityChange(
                                        item.itemId,
                                        item.quantity,
                                        1,
                                        item.category
                                      );
                                    } else if (menuItems) {
                                      const menuItem = menuItems.find(
                                        (menuItem) =>
                                          menuItem.name === item.description
                                      );
                                      if (menuItem) {
                                        handleQuantityChange(
                                          menuItem._id,
                                          item.quantity,
                                          1,
                                          menuItem.category
                                        );
                                      }
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
                          <span className="col-span-3 text-right text-xs sm:text-sm">
                            {item.price.toLocaleString("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            })}
                          </span>
                          <span className="col-span-3 text-right text-xs sm:text-sm">
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

                  {/* Mobile Layout */}
                  <div className="sm:hidden space-y-2">
                    {items.map((item: BillItem, index: number) => (
                      <div
                        key={index}
                        className="border-b border-purple-200 pb-2"
                      >
                        <div className="font-semibold text-purple-700 mb-1 break-words">
                          {item.description}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {!item.description
                              .toLowerCase()
                              .includes("phi dich vu thu am") && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (item.itemId && item.category) {
                                      handleQuantityChange(
                                        item.itemId,
                                        item.quantity,
                                        -1,
                                        item.category
                                      );
                                    } else if (menuItems) {
                                      const menuItem = menuItems.find(
                                        (menuItem) =>
                                          menuItem.name === item.description
                                      );
                                      if (menuItem) {
                                        handleQuantityChange(
                                          menuItem._id,
                                          item.quantity,
                                          -1,
                                          menuItem.category
                                        );
                                      }
                                    }
                                  }}
                                  disabled={
                                    item.quantity <= 0 || isUpdatingQuantity
                                  }
                                  className="w-8 h-8 p-0"
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <span className="min-w-[2rem] text-center font-semibold">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (item.itemId && item.category) {
                                      handleQuantityChange(
                                        item.itemId,
                                        item.quantity,
                                        1,
                                        item.category
                                      );
                                    } else if (menuItems) {
                                      const menuItem = menuItems.find(
                                        (menuItem) =>
                                          menuItem.name === item.description
                                      );
                                      if (menuItem) {
                                        handleQuantityChange(
                                          menuItem._id,
                                          item.quantity,
                                          1,
                                          menuItem.category
                                        );
                                      }
                                    }
                                  }}
                                  disabled={isUpdatingQuantity}
                                  className="w-8 h-8 p-0"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {item.description
                              .toLowerCase()
                              .includes("phi dich vu thu am") && (
                              <span className="font-semibold">
                                SL: {item.quantity}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-600">
                              {item.price.toLocaleString("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              })}
                              /cái
                            </div>
                            <div className="font-semibold text-purple-700">
                              {(item.price * item.quantity).toLocaleString(
                                "vi-VN",
                                {
                                  style: "currency",
                                  currency: "VND",
                                }
                              )}
                            </div>
                          </div>
                        </div>
                        {item.discountName && item.discountPercentage ? (
                          <div className="text-xs text-green-600 italic mt-1">
                            - {item.discountName} ({item.discountPercentage}%):{" "}
                            {(
                              (item.price *
                                item.quantity *
                                (item.discountPercentage || 0)) /
                              100
                            ).toLocaleString("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            })}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t-2 border-dashed border-purple-400" />

                {/* Free Hour Promotion Checkbox */}
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    id="free-hour-promo"
                    checked={applyFreeHourPromo}
                    onCheckedChange={(checked) => {
                      const newValue = checked === true;
                      setApplyFreeHourPromo(newValue);
                      updateFreeHourPromo(newValue);
                    }}
                    disabled={isUpdatingFreeHourPromo}
                  />
                  <Label
                    htmlFor="free-hour-promo"
                    className="text-xs sm:text-sm cursor-pointer"
                  >
                    Áp dụng khuyến mãi (chỉ áp dụng bill order snack hoặc nước
                    có giá trị trên 35k)
                  </Label>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Chỉ áp dụng từ 10h đến 19h
                  </p>
                </div>

                {/* Lucky Draw Promotion Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Gift className="w-4 h-4 text-pink-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm whitespace-nowrap">
                      Khuyến mãi:
                    </span>
                  </div>
                  <Select
                    value={selectedPromotion || "none"}
                    onValueChange={handlePromotionChange}
                  >
                    <SelectTrigger className="w-full sm:w-[180px] h-9 sm:h-9">
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

                {/* Gift hiển thị trong bill */}
                {gift && (
                  <div className="p-2 mb-2 bg-pink-50 border border-pink-200 rounded-md text-pink-700 text-xs sm:text-sm space-y-1">
                    <div className="font-bold flex items-center gap-2">
                      <Gift className="w-4 h-4" />
                      <span>Quà tặng: {gift.name}</span>
                    </div>
                    {gift.type === "discount" && gift.discountPercentage ? (
                      <p>Giảm {gift.discountPercentage}%</p>
                    ) : null}
                    {giftDiscountAmount > 0 && (
                      <p className="text-pink-700">
                        Trị giá giảm:{" "}
                        {giftDiscountAmount.toLocaleString("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        })}
                      </p>
                    )}
                    {gift.type === "snacks_drinks" &&
                    gift.items &&
                    gift.items.length > 0 ? (
                      <div className="space-y-0.5">
                        <p className="font-medium">Items tặng:</p>
                        <ul className="list-disc list-inside pl-3 space-y-0.5">
                          {gift.items.map((item, idx) => (
                            <li key={idx}>
                              {item.name} x{item.quantity}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                )}

                {appliedPromotion && (
                  <div className="p-2 bg-green-100 rounded-md text-green-700 text-xs sm:text-sm">
                    <p className="font-bold">{appliedPromotion.name}</p>
                    <p className="break-words">
                      {appliedPromotion.description}
                    </p>
                    <p className="text-right font-bold">
                      Giảm: {appliedPromotion.discountPercentage}%
                    </p>
                  </div>
                )}

                {/* Hiển thị chi tiết tính toán giá */}
                <div className="space-y-2 border-t-2 border-dashed border-purple-400 pt-2">
                  {/* Chi tiết từng khoản */}
                  {roomTotal && roomTotal > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Tiền phòng:</span>
                      <span className="text-gray-800 break-words ml-2 text-right">
                        {roomTotal.toLocaleString("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        })}
                      </span>
                    </div>
                  )}

                  {/* Free Hour Promotion */}
                  {freeHourPromotion && freeHourPromotion.freeAmount > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-blue-600 break-words">
                        {(() => {
                          // Tính khung giờ đầu tiên từ giờ bắt đầu + 60 phút
                          const startTime = customStartTime
                            ? dayjs(schedule.startTime)
                                .set(
                                  "hour",
                                  parseInt(customStartTime.split(":")[0])
                                )
                                .set(
                                  "minute",
                                  parseInt(customStartTime.split(":")[1])
                                )
                                .set("second", 0)
                            : dayjs(schedule.startTime);
                          const endTime = startTime.add(60, "minute");
                          const timeRange = `${startTime.format(
                            "HH:mm"
                          )} - ${endTime.format("HH:mm")}`;
                          return `Chương trình KM (${timeRange}):`;
                        })()}
                      </span>
                      <span className="text-blue-600 font-medium break-words ml-2 text-right">
                        -
                        {freeHourPromotion.freeAmount.toLocaleString("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        })}
                      </span>
                    </div>
                  )}

                  {/* Tính toán giá gốc */}
                  {(() => {
                    // totalAmount từ API đã là tổng sau khi trừ free hour và promotion
                    const freeHourDiscount = freeHourPromotion?.freeAmount || 0;

                    // Tính tổng gốc từ items hoặc từ roomTotal + fnbTotal
                    let originalTotal = (roomTotal || 0) + (fnbTotal || 0);

                    // Nếu không có roomTotal/fnbTotal, tính từ items
                    if (originalTotal === 0 && items && items.length > 0) {
                      originalTotal = items.reduce(
                        (sum, item) => sum + item.price * item.quantity,
                        0
                      );
                    }

                    // Nếu vẫn không có, tính từ totalAmount + freeAmount (vì totalAmount đã trừ freeAmount)
                    if (originalTotal === 0 && totalAmount) {
                      originalTotal = totalAmount + freeHourDiscount;
                    }

                    // Tổng sau khi trừ free hour
                    const afterFreeHourTotal = Math.max(
                      0,
                      originalTotal - freeHourDiscount
                    );

                    // Tính promotion discount (nếu có) dựa trên tổng sau khi trừ free hour
                    const promotionDiscountAmount = appliedPromotion
                      ? (afterFreeHourTotal *
                          (appliedPromotion.discountPercentage || 0)) /
                        100
                      : 0;

                    // Tổng cuối cùng: sử dụng totalAmount từ API (đã được tính sẵn)
                    const finalTotal = totalAmount || 0;

                    return (
                      <>
                        {/* Giảm giá từ quà tặng */}
                        {giftDiscountAmount > 0 && (
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-pink-600 break-words">
                              Giảm quà tặng{gift?.name ? ` (${gift.name})` : ""}
                              :
                            </span>
                            <span className="text-pink-600 font-medium break-words ml-2 text-right">
                              -
                              {giftDiscountAmount.toLocaleString("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              })}
                            </span>
                          </div>
                        )}
                        {/* Giảm giá promotion (nếu có) */}
                        {appliedPromotion && promotionDiscountAmount > 0 && (
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-green-600 break-words">
                              Giảm {appliedPromotion.name} (
                              {appliedPromotion.discountPercentage}%):
                            </span>
                            <span className="text-green-600 font-medium break-words ml-2 text-right">
                              -
                              {promotionDiscountAmount.toLocaleString("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              })}
                            </span>
                          </div>
                        )}

                        {/* Giá cuối cùng */}
                        <div className="flex justify-between font-bold text-base sm:text-lg text-pink-600 border-t border-gray-300 pt-2">
                          <span>Tổng cộng:</span>
                          <span className="break-words ml-2 text-right">
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
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <span className="text-xs sm:text-sm whitespace-nowrap">
                      💳 Thanh toán:
                    </span>
                    <Select
                      defaultValue={PaymentMethod.Cash}
                      value={paymentMethod}
                      onValueChange={handlePaymentMethodChange}
                    >
                      <SelectTrigger className="w-full sm:w-[180px] h-9 sm:h-9">
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
                  {/* Note Section */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2">
                    <span className="text-xs sm:text-sm whitespace-nowrap">
                      📝 Ghi chú:
                    </span>
                    {isEditingNote ? (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 w-full">
                        <Input
                          value={noteValue}
                          onChange={(e) => setNoteValue(e.target.value)}
                          placeholder="Nhập ghi chú..."
                          className="flex-1 h-9 sm:h-9"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveNote}
                            disabled={isUpdatingNote}
                            className="bg-green-600 hover:bg-green-700 h-9 sm:h-9 flex-1 sm:flex-none"
                          >
                            {isUpdatingNote ? "Đang lưu..." : "Lưu"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEditNote}
                            className="h-9 sm:h-9 flex-1 sm:flex-none"
                          >
                            Hủy
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1 w-full">
                        <span className="flex-1 break-words text-xs sm:text-sm">
                          {note || "Chưa có ghi chú"}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleEditNote}
                          disabled={isUpdatingNote}
                          className="text-xs h-9 sm:h-9 w-full sm:w-auto"
                        >
                          Chỉnh sửa
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="border-t-2 border-dashed border-purple-400" />
                <div className="text-center">
                  <p className="text-purple-700 font-bold text-xs sm:text-sm">
                    Jozo - Vui Hết Ý!
                  </p>
                  <p className="text-xs italic">Hẹn gặp lại nhé! 😉</p>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Footer with Buttons */}
          <div className="border-t bg-background px-4 sm:px-6 py-4 flex-shrink-0">
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 mb-4">
              <Button
                variant="outline"
                onClick={openMenuItemsModal}
                className="text-sm sm:text-base px-4 sm:px-5 py-2.5 sm:py-2 h-auto w-full sm:w-auto"
              >
                Thêm Menu Items
              </Button>
              <Button
                onClick={handleExtendSession}
                disabled={isPending}
                className="text-sm sm:text-base px-4 sm:px-5 py-2.5 sm:py-2 h-auto w-full sm:w-auto"
              >
                Gia hạn
              </Button>
              <Button
                variant="outline"
                className="border-purple-400 text-purple-600 hover:bg-purple-200 text-sm sm:text-base px-4 sm:px-5 py-2.5 sm:py-2 h-auto w-full sm:w-auto"
                onClick={() => printBill()}
              >
                <Printer className="w-4 h-4 mr-2" />
                In hóa đơn
              </Button>

              <Button
                variant="destructive"
                onClick={() => setIsConfirmEndOpen(true)}
                disabled={isPending || isSavingBill}
                className="text-sm sm:text-base px-4 sm:px-5 py-2.5 sm:py-2 h-auto w-full sm:w-auto"
              >
                Kết thúc
              </Button>
            </div>
            <DialogFooter className="mt-0">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isPending}
                className="text-sm sm:text-base px-4 sm:px-5 py-2.5 sm:py-2 h-auto w-full sm:w-auto"
              >
                Đóng
              </Button>
            </DialogFooter>
          </div>
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

      <MemberInfoModal
        isOpen={isMemberInfoModalOpen}
        onClose={() => setIsMemberInfoModalOpen(false)}
        phone={customerPhoneValue || schedule.customerPhone}
      />

      <ClaimGiftModal
        isOpen={isClaimGiftModalOpen}
        onClose={() => setIsClaimGiftModalOpen(false)}
        scheduleId={schedule._id}
        defaultPhone={customerPhoneValue || schedule.customerPhone || ""}
        onGiftClaimed={() => {
          // Refresh bill query
          queryClient.invalidateQueries({
            queryKey: [
              "bill",
              schedule._id,
              selectedPromotion,
              customEndTime,
              customStartTime,
            ],
          });
          // Refresh schedules
          refetchSchedules?.();
        }}
      />
    </>
  );
};

export default ProcessInUseModal;
