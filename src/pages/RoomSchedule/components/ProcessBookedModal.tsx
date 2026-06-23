import { IRoom, IRoomSchedule } from "@/@types/Room";
import roomsScheduleApis, { IChangeRoomRequest } from "@/apis/roomSchedule.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { RoomStatus } from "@/constants/enum";
import roomApis from "@/apis/room.apis";
import useAuth from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs, {
  parseUTCToLocal,
  toIsoStringWithZeroSubsecond,
} from "@/lib/dayjs";
import * as React from "react";
import MenuItemsModal from "@/components/modules/RoomSchedule/MenuItemsModal";
import { useScheduleMemberPhone } from "../hooks/useScheduleMemberPhone";
import ScheduleMemberSection from "./ScheduleMemberSection";
import fnbMenuApis from "@/apis/fnbMenu.apis";
import fnbOrderApis from "@/apis/fnbOrder.apis";
import { IAddRemoveItemRequestBody } from "@/apis/fnbOrder.apis";
import { OrderDetail } from "@/@types/FnbOrder";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Coffee,
  Utensils,
  Plus,
  Minus,
  User,
  ArrowUpRight,
  Globe,
  UserCheck,
  Building,
} from "lucide-react";

// Import type MenuItem từ MenuItemsModal
interface MenuItem {
  _id: string;
  name: string;
  parentId: string | null;
  hasVariant: boolean;
  price: number;
  image: string;
  category: string;
  inventory: {
    quantity: number;
    minStock?: number;
    maxStock?: number;
    lastUpdated?: string;
  };
  createdAt: string;
  updatedAt: string;
  existingImage?: string;
  quantity?: string;
  variants?: string;
}

/** Ghép YYYY-MM-DD + HH:mm(ss) theo giờ tường VN rồi trả về ISO UTC (chuẩn BE). */
const wallTimeVietnamToUtcIso = (dateStr: string, timeStr: string) => {
  const t =
    timeStr.length === 5
      ? `${timeStr}:00`
      : timeStr.length === 8
        ? timeStr
        : timeStr;
  const d = dayjs.tz(`${dateStr}T${t}`, "Asia/Ho_Chi_Minh");
  if (!d.isValid()) return null;
  return toIsoStringWithZeroSubsecond(d.utc());
};

interface ProcessBookedModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: IRoomSchedule;
  refetchSchedules: VoidFunction;
}

const ProcessBookedModal: React.FC<ProcessBookedModalProps> = ({
  isOpen,
  onClose,
  schedule,
  refetchSchedules,
}) => {
  const { user } = useAuth();
  const eventStart = parseUTCToLocal(schedule.startTime);
  const eventEnd = schedule.endTime
    ? parseUTCToLocal(schedule.endTime)
    : eventStart.add(120, "minute");

  // Gift info (API trả về gift object, khác với giftEnabled)
  const giftInfo = (schedule as unknown as { gift?: any }).gift;
  const hasGift = !!giftInfo;
  const giftStatus = giftInfo?.status;
  const isGiftClaimed = giftStatus === "claimed";
  const giftItems =
    giftInfo?.type === "snacks_drinks" && Array.isArray(giftInfo?.items)
      ? giftInfo.items
      : [];

  // State cho thời gian điều chỉnh
  const [adjustedStartDate, setAdjustedStartDate] = React.useState<string>("");
  const [adjustedEndDate, setAdjustedEndDate] = React.useState<string>("");
  const [adjustedStartTime, setAdjustedStartTime] = React.useState<string>("");
  const [adjustedEndTime, setAdjustedEndTime] = React.useState<string>("");

  // State cho modal đặt đồ ăn
  const [isMenuModalOpen, setIsMenuModalOpen] = React.useState(false);

  // State cho edit note
  const [isEditingNote, setIsEditingNote] = React.useState(false);
  const [noteValue, setNoteValue] = React.useState<string>("");

  // State để lưu schedule hiện tại (để sync với cache)
  const [currentSchedule, setCurrentSchedule] =
    React.useState<IRoomSchedule>(schedule);

  // State đổi phòng
  const [targetRoomId, setTargetRoomId] = React.useState<string>("");
  const [roomChangeNote, setRoomChangeNote] = React.useState<string>("");

  const queryClient = useQueryClient();

  const member = useScheduleMemberPhone({
    scheduleId: schedule._id,
    initialPhone: schedule.customerPhone || "",
    initialGiftEnabled: schedule.giftEnabled,
    isOpen,
    refetchSchedules,
  });

  // Query danh sách phòng để đổi
  const { data: roomsData, isLoading: isLoadingRooms } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomApis.getRooms(),
    staleTime: 5 * 60 * 1000,
  });

  // Query lấy menu items
  const { data: menuItemsData } = useQuery({
    queryKey: ["menuItems"],
    queryFn: () => fnbMenuApis.getAllMenuItems(),
    enabled: isOpen,
  });

  // Query lấy order detail
  const { data: orderDetailData } = useQuery<OrderDetail | undefined>({
    queryKey: ["fnbOrderDetail", schedule._id],
    queryFn: () =>
      schedule._id
        ? fnbOrderApis
            .getFnbOrderDetail(schedule._id)
            .then((res) => res.data.result as OrderDetail)
        : Promise.resolve(undefined),
    enabled: isOpen && !!schedule._id,
    refetchOnWindowFocus: false,
  });

  // Mutation để cập nhật số lượng (dùng add/remove)
  const { mutate: updateQuantity, isPending: isUpdatingQuantity } = useMutation(
    {
      mutationFn: async ({
        itemId,
        quantity,
        category,
      }: {
        itemId: string;
        quantity: number;
        category: string;
      }) => {
        if (!schedule._id || !schedule.createdBy) return;

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
        const isDrinks = category === "drinks";
        const payload: IAddRemoveItemRequestBody = {
          order: {
            ...(isDrinks
              ? { drinks: { [itemId]: Math.abs(diff) } }
              : { snacks: { [itemId]: Math.abs(diff) } }),
          },
          createdBy: schedule.createdBy,
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
          queryKey: ["fnbOrderDetail", schedule._id],
        });

        // Snapshot the previous value
        const previousOrderData = queryClient.getQueryData([
          "fnbOrderDetail",
          schedule._id,
        ]);

        // Get current quantity to calculate diff
        const currentQuantity =
          orderDetailData?.items?.drinks?.find((item) => item.itemId === itemId)
            ?.quantity ||
          orderDetailData?.items?.snacks?.find((item) => item.itemId === itemId)
            ?.quantity ||
          0;

        const quantityDiff = quantity - currentQuantity;

        // Optimistically update to the new value
        queryClient.setQueryData(
          ["fnbOrderDetail", schedule._id],
          (old: OrderDetail | undefined) => {
            if (!old) return old;

            const newDrinks = old.items.drinks.map((item) =>
              item.itemId === itemId ? { ...item, quantity } : item,
            );
            const newSnacks = old.items.snacks.map((item) =>
              item.itemId === itemId ? { ...item, quantity } : item,
            );

            return {
              ...old,
              items: {
                drinks: newDrinks,
                snacks: newSnacks,
              },
            };
          },
        );

        // Optimistically update inventory
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
                          (menuItem.inventory?.quantity || 0) - quantityDiff,
                        ),
                      },
                    };
                  }
                  return item;
                }),
              },
            };
          },
        );

        return { previousOrderData, currentQuantity };
      },
      onError: (_err, _variables, context) => {
        // If the mutation fails, use the context returned from onMutate to roll back
        if (context?.previousOrderData) {
          queryClient.setQueryData(
            ["fnbOrderDetail", schedule._id],
            context.previousOrderData,
          );
        }
        // Rollback inventory
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
                            (menuItem.inventory?.quantity || 0) + quantityDiff,
                          ),
                        },
                      };
                    }
                    return item;
                  }),
                },
              };
            },
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
          queryKey: ["fnbOrderDetail", schedule._id],
        });
        // Refetch menuItems để đảm bảo inventory được cập nhật từ server
        queryClient.invalidateQueries({ queryKey: ["menuItems"] });
      },
    },
  );

  const menuItems = (menuItemsData?.data?.result ||
    []) as unknown as MenuItem[];
  const rooms = (roomsData?.data?.result || []) as IRoom[];
  const availableRooms = rooms.filter((room) => room._id !== schedule.roomId);

  // Hàm lấy thông tin source và màu sắc
  const getSourceInfo = (source?: string) => {
    switch (source) {
      case "customer":
        return {
          label: "Khách hàng online",
          icon: Globe,
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        };
      case "admin":
        return {
          label: "Admin đặt",
          icon: UserCheck,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
        };
      case "walk-in":
        return {
          label: "Walk-in",
          icon: Building,
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          borderColor: "border-purple-200",
        };
      default:
        return {
          label: "Đặt bởi Hệ thống",
          icon: User,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
        };
    }
  };

  // Hàm xử lý edit note
  const handleEditNote = () => {
    setIsEditingNote(true);
  };

  // Hàm xử lý save note
  const handleSaveNote = () => {
    updateNote(noteValue);
  };

  // Hàm xử lý cancel edit note
  const handleCancelEditNote = () => {
    setNoteValue(currentSchedule.note || "");
    setIsEditingNote(false);
  };

  // Khởi tạo state khi schedule thay đổi
  React.useEffect(() => {
    if (schedule) {
      setCurrentSchedule(schedule);
      const start = parseUTCToLocal(schedule.startTime);
      const defaultEnd = schedule.endTime
        ? parseUTCToLocal(schedule.endTime)
        : start.add(120, "minute");

      setAdjustedStartDate(start.format("YYYY-MM-DD"));
      setAdjustedEndDate(defaultEnd.format("YYYY-MM-DD"));
      setAdjustedStartTime(start.format("HH:mm"));
      setAdjustedEndTime(defaultEnd.format("HH:mm"));
      setNoteValue(schedule.note || "");
      setIsEditingNote(false);
      setTargetRoomId("");
      setRoomChangeNote("");
    }
  }, [schedule]);

  // Hàm xử lý tăng/giảm số lượng
  const handleQuantityChange = (
    itemId: string,
    currentQuantity: number,
    change: number,
    category: string,
  ) => {
    const newQuantity = Math.max(0, currentQuantity + change);
    updateQuantity({
      itemId,
      quantity: newQuantity,
      category, // Giữ nguyên "drinks" hoặc "snacks"
    });
  };

  const { mutate, isPending } = useMutation({
    mutationFn: (updateData: Partial<IRoomSchedule>) =>
      roomsScheduleApis.updateSchedule(schedule._id, updateData),
    onSuccess: (_, variables) => {
      refetchSchedules();
      if (variables.status) {
        onClose();
        toast({
          title: "Success",
          description: `Schedule updated to ${variables.status}`,
        });
      } else {
        toast({
          title: "Success",
          description: "Thời gian đã được cập nhật",
        });
      }
    },
  });

  // Mutation riêng để cập nhật note
  const { mutate: updateNote, isPending: isUpdatingNote } = useMutation({
    mutationFn: (note: string) =>
      roomsScheduleApis.updateSchedule(schedule._id, { note }),
    onMutate: async (newNote) => {
      // Cancel any outgoing refetches để tránh overwrite optimistic update
      const queryKey = [
        "roomSchedules",
        parseUTCToLocal(schedule.startTime).toISOString(),
      ];

      await queryClient.cancelQueries({ queryKey });

      // Snapshot giá trị cũ
      const previousSchedules =
        queryClient.getQueryData<IRoomSchedule[]>(queryKey);

      // Optimistically update cache
      queryClient.setQueryData<IRoomSchedule[]>(queryKey, (old) => {
        if (!old) return old;
        return old.map((s) =>
          s._id === schedule._id ? { ...s, note: newNote } : s,
        );
      });

      // Cập nhật noteValue và currentSchedule để UI hiển thị ngay
      setNoteValue(newNote);
      setCurrentSchedule((prev) => ({ ...prev, note: newNote }));

      return { previousSchedules, queryKey };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ghi chú đã được cập nhật",
      });
      setIsEditingNote(false);
      // Invalidate để sync với server (nhưng không refetch ngay)
      const queryKey = [
        "roomSchedules",
        parseUTCToLocal(schedule.startTime).toISOString(),
      ];
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error, _newNote, context) => {
      console.error("Error updating note:", error);

      // Rollback về giá trị cũ nếu có lỗi
      if (context?.previousSchedules && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousSchedules);
        // Rollback noteValue và currentSchedule
        const originalNote = schedule.note || "";
        setNoteValue(originalNote);
        setCurrentSchedule((prev) => ({ ...prev, note: originalNote }));
      }

      toast({
        title: "Error",
        description: "Không thể cập nhật ghi chú",
        variant: "destructive",
      });
    },
  });

  // Mutation đổi phòng
  const { mutate: changeRoom, isPending: isChangingRoom } = useMutation({
    mutationFn: (payload: IChangeRoomRequest) =>
      roomsScheduleApis.changeRoom(schedule._id, payload),
    onSuccess: () => {
      refetchSchedules();
      onClose();
      toast({
        title: "Success",
        description: "Đã đổi phòng thành công",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Không thể đổi phòng, vui lòng thử lại",
        variant: "destructive",
      });
    },
  });

  const handleChangeRoom = () => {
    if (!targetRoomId) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn phòng mới trước khi chuyển.",
        variant: "destructive",
      });
      return;
    }

    if (targetRoomId === schedule.roomId) {
      toast({
        title: "Phòng mới phải khác phòng cũ",
        description: "Vui lòng chọn phòng khác để chuyển.",
        variant: "destructive",
      });
      return;
    }

    const payload: IChangeRoomRequest = {
      roomId: schedule.roomId,
      newRoomId: targetRoomId,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      status: schedule.status,
      roomChangeNote: roomChangeNote || undefined,
      updatedBy: user?._id,
    };

    changeRoom(payload);
  };

  const handleUpdate = (newStatus: RoomStatus) => {
    const updateData: Partial<IRoomSchedule> = { status: newStatus };

    // Nếu chuyển sang "In use", sử dụng thời gian đã điều chỉnh hoặc thời gian hiện tại
    if (newStatus === RoomStatus.InUse) {
      if (adjustedStartTime) {
        // Sử dụng thời gian đã điều chỉnh
        const datePart =
          adjustedStartDate ||
          parseUTCToLocal(schedule.startTime).format("YYYY-MM-DD");
        const newStartIso = wallTimeVietnamToUtcIso(
          datePart,
          adjustedStartTime,
        );
        if (newStartIso) {
          updateData.startTime = newStartIso;
          // Thông báo cho người dùng biết đã sử dụng thời gian đã điều chỉnh
          toast({
            title: "Thời gian đã được điều chỉnh",
            description: `Sử dụng thời gian bắt đầu: ${adjustedStartTime}`,
          });
        } else {
          // Nếu thời gian không hợp lệ, sử dụng thời gian hiện tại
          updateData.startTime = toIsoStringWithZeroSubsecond(dayjs());
          toast({
            title: "Thời gian không hợp lệ",
            description: "Sử dụng thời gian hiện tại",
          });
        }
      } else {
        // Nếu chưa điều chỉnh thời gian, sử dụng thời gian hiện tại
        updateData.startTime = toIsoStringWithZeroSubsecond(dayjs());
      }
    }
    // Nếu chuyển sang "Cancelled", cập nhật endTime thành thời gian hiện tại.
    else if (newStatus === RoomStatus.Cancelled) {
      updateData.endTime = toIsoStringWithZeroSubsecond(dayjs());
    }

    // Gọi API update với dữ liệu mới (bao gồm status và thời gian)
    mutate(updateData);
  };

  // Hàm cập nhật thời gian mới dựa vào input
  const handleUpdateTime = () => {
    // Lấy phần ngày, cho phép chỉnh riêng start date và end date
    const fallbackDate = parseUTCToLocal(schedule.startTime).format(
      "YYYY-MM-DD",
    );
    const startDatePart = adjustedStartDate || fallbackDate;
    const endDatePart = adjustedEndDate || startDatePart;

    const newStartIso = wallTimeVietnamToUtcIso(
      startDatePart,
      adjustedStartTime,
    );
    let newEndIso = wallTimeVietnamToUtcIso(endDatePart, adjustedEndTime);

    if (!newStartIso || !newEndIso) {
      toast({
        title: "Invalid time",
        description: "Please enter valid times.",
      });
      return;
    }

    const startUtc = dayjs.utc(newStartIso);
    let endUtc = dayjs.utc(newEndIso);

    // Nếu end time nhỏ hơn start time (qua 00:00) thì tự động sang ngày hôm sau
    if (endUtc.isBefore(startUtc)) {
      endUtc = endUtc.add(1, "day");
      setAdjustedEndDate(endUtc.tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD"));
      newEndIso = toIsoStringWithZeroSubsecond(endUtc);
    }

    const updateData: Partial<IRoomSchedule> = {
      startTime: newStartIso,
      endTime: newEndIso,
    };

    mutate(updateData);
  };

  // Kiểm tra xem có order nào không
  const hasOrders =
    orderDetailData &&
    orderDetailData.items &&
    ((orderDetailData.items.drinks &&
      orderDetailData.items.drinks.length > 0) ||
      (orderDetailData.items.snacks &&
        orderDetailData.items.snacks.length > 0));

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="max-w-full max-h-[100dvh] overflow-y-auto overscroll-y-contain gap-0 p-0 sm:max-h-[94vh] sm:max-w-[725px]"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-2 sm:pt-6 sm:pb-6">
          <DialogHeader className="pr-10">
            <DialogTitle>Xử lý booking</DialogTitle>
            <DialogDescription>
              Kiểm tra thông tin thành viên, điều chỉnh giờ hoặc chuyển trạng
              thái phiên.
            </DialogDescription>
          </DialogHeader>

          <ScheduleMemberSection
            className="mt-4"
            inputId="booked-member-phone"
            phone={member.phone}
            savedPhone={member.savedPhone}
            onPhoneChange={member.setPhone}
            isPhoneDirty={member.isPhoneDirty}
            hasSavedValidPhone={member.hasSavedValidPhone}
            isSavingPhone={member.isSavingPhone}
            onSavePhone={member.savePhone}
            isGiftEnabled={member.isGiftEnabled}
            onGiftEnabledChange={member.updateGiftEnabled}
            isUpdatingGiftEnabled={member.isUpdatingGiftEnabled}
            hasClaimedGift={hasGift && isGiftClaimed}
            giftDetail={
              hasGift
                ? {
                    name: giftInfo?.name,
                    status: giftStatus,
                    type: giftInfo?.type,
                    discountPercentage: giftInfo?.discountPercentage,
                    items: giftItems,
                  }
                : null
            }
            customerName={schedule.customerName}
            customerEmail={schedule.customerEmail}
            memberInfo={member.memberInfo}
            isLoadingMemberInfo={member.isLoadingMemberInfo}
            isMemberInfoError={member.isMemberInfoError}
            isMemberNotFound={member.isMemberNotFound}
            availableGifts={member.availableGifts}
            streakRewards={member.streakRewards}
            giftItemsById={member.giftItemsById}
            onServeGift={member.serveStreakGift}
            isServingGift={member.isServingGift}
          />

          <div className="space-y-2 mt-4">
            <p>
              <span className="font-medium">Start:</span>{" "}
              {eventStart.format("HH:mm")}
            </p>
            <p>
              <span className="font-medium">End:</span>{" "}
              {eventEnd.format("HH:mm")}
            </p>
            <div>
              <span className="font-medium">Note:</span>
              {isEditingNote ? (
                <div className="mt-2 space-y-2">
                  <Input
                    value={noteValue}
                    onChange={(e) => setNoteValue(e.target.value)}
                    placeholder="Nhập ghi chú..."
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveNote}
                      disabled={isUpdatingNote}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isUpdatingNote ? "Đang lưu..." : "Lưu"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEditNote}
                      disabled={isUpdatingNote}
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex items-start gap-2">
                  <p className="flex-1 break-words">
                    {currentSchedule.note || "Chưa có ghi chú"}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEditNote}
                    disabled={isUpdatingNote}
                  >
                    Chỉnh sửa
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Thông tin nguồn booking */}
          {schedule.source === "customer" && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                {React.createElement(getSourceInfo(schedule.source).icon, {
                  className: `w-4 h-4 ${getSourceInfo(schedule.source).color}`,
                })}
                Nguồn booking
              </h3>
              <div
                className={`${
                  getSourceInfo(schedule.source).bgColor
                } p-3 rounded-lg border ${
                  getSourceInfo(schedule.source).borderColor
                }`}
              >
                <Badge
                  variant="outline"
                  className={`${getSourceInfo(schedule.source).color} ${
                    getSourceInfo(schedule.source).borderColor
                  }`}
                >
                  {getSourceInfo(schedule.source).label}
                </Badge>
              </div>
            </div>
          )}

          {/* Đổi phòng */}
          {schedule.upgraded && schedule.originalRoomType && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-orange-500" />
                Thông tin nâng cấp phòng
              </h3>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-orange-600 border-orange-200"
                  >
                    Đã nâng cấp
                  </Badge>
                  <span className="text-sm">
                    <span className="font-medium">Phòng gốc:</span>{" "}
                    {schedule.originalRoomType}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Đổi phòng */}
          <div className="mt-4 space-y-2">
            <h3 className="font-semibold">Đổi phòng</h3>
            <div className="space-y-2">
              <Select
                value={targetRoomId}
                onValueChange={setTargetRoomId}
                disabled={isLoadingRooms || availableRooms.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      availableRooms.length === 0
                        ? "Không còn phòng khác để đổi"
                        : "Chọn phòng muốn chuyển"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.map((room) => (
                    <SelectItem key={String(room._id)} value={String(room._id)}>
                      {room.roomName} - {room.roomType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Textarea
                placeholder="Lý do đổi phòng (tuỳ chọn)"
                value={roomChangeNote}
                onChange={(e) => setRoomChangeNote(e.target.value)}
                className="min-h-[80px]"
              />

              <Button
                variant="secondary"
                onClick={handleChangeRoom}
                loading={isChangingRoom}
                disabled={availableRooms.length === 0}
              >
                Chuyển sang phòng mới
              </Button>
            </div>
          </div>

          {/* Hiển thị thông tin đã đặt snacks và drinks */}
          {hasOrders && (
            <div className="mt-4 space-y-2">
              <h3 className="font-semibold">Ordered Snacks & Drinks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Drinks */}
                {orderDetailData?.items?.drinks &&
                  orderDetailData.items.drinks.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Coffee className="w-4 h-4" />
                          Drinks
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-1">
                          {orderDetailData.items.drinks.map((item) => (
                            <div
                              key={item.itemId}
                              className="flex justify-between items-center"
                            >
                              <span className="text-sm">{item.name}</span>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.itemId,
                                      item.quantity,
                                      -1,
                                      "drinks",
                                    )
                                  }
                                  disabled={isUpdatingQuantity}
                                  className="w-6 h-6 p-0"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <Badge variant="secondary">
                                  {item.quantity}
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.itemId,
                                      item.quantity,
                                      1,
                                      "drinks",
                                    )
                                  }
                                  disabled={isUpdatingQuantity}
                                  className="w-6 h-6 p-0"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Snacks */}
                {orderDetailData?.items?.snacks &&
                  orderDetailData.items.snacks.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Utensils className="w-4 h-4" />
                          Snacks
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-1">
                          {orderDetailData.items.snacks.map((item) => (
                            <div
                              key={item.itemId}
                              className="flex justify-between items-center"
                            >
                              <span className="text-sm">{item.name}</span>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.itemId,
                                      item.quantity,
                                      -1,
                                      "snacks",
                                    )
                                  }
                                  disabled={isUpdatingQuantity}
                                  className="w-6 h-6 p-0"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <Badge variant="secondary">
                                  {item.quantity}
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.itemId,
                                      item.quantity,
                                      1,
                                      "snacks",
                                    )
                                  }
                                  disabled={isUpdatingQuantity}
                                  className="w-6 h-6 p-0"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
              </div>
            </div>
          )}

          {/* Phần điều chỉnh ngày & thời gian */}
          <div className="mt-4 space-y-3">
            <h3 className="font-semibold">Adjust Date & Time</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="adjustedStartDate" className="text-sm">
                  Start Date:
                </label>
                <input
                  id="adjustedStartDate"
                  type="date"
                  value={adjustedStartDate}
                  onChange={(e) => setAdjustedStartDate(e.target.value)}
                  className="border rounded p-1 w-full"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="adjustedEndDate" className="text-sm">
                  End Date:
                </label>
                <input
                  id="adjustedEndDate"
                  type="date"
                  value={adjustedEndDate}
                  onChange={(e) => setAdjustedEndDate(e.target.value)}
                  className="border rounded p-1 w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="adjustedStartTime" className="text-sm">
                  Start Time:
                </label>
                <input
                  id="adjustedStartTime"
                  type="time"
                  value={adjustedStartTime}
                  onChange={(e) => setAdjustedStartTime(e.target.value)}
                  className="border rounded p-1 w-full"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="adjustedEndTime" className="text-sm">
                  End Time:
                </label>
                <input
                  id="adjustedEndTime"
                  type="time"
                  value={adjustedEndTime}
                  onChange={(e) => setAdjustedEndTime(e.target.value)}
                  className="border rounded p-1 w-full"
                />
              </div>
            </div>
            <Button
              variant="default"
              onClick={handleUpdateTime}
              loading={isPending}
            >
              Update Time
            </Button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-2 pt-6 border-t mt-6">
            <Button
              variant="outline"
              onClick={() => setIsMenuModalOpen(true)}
              className="w-full sm:w-auto"
            >
              Order Snacks & Drinks
            </Button>

            <Button
              variant="default"
              onClick={() => {
                handleUpdate(RoomStatus.InUse);
              }}
              loading={isPending}
              className="w-full sm:w-auto"
            >
              Bắt đầu sử dụng
              {adjustedStartTime && (
                <span className="text-xs ml-1 opacity-70">
                  ({adjustedStartTime})
                </span>
              )}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                handleUpdate(RoomStatus.Cancelled);
              }}
              loading={isPending}
              className="w-full sm:w-auto"
            >
              Hủy booking
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Modal đặt đồ ăn */}
      <MenuItemsModal
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
        menuItems={menuItems}
        roomId={schedule.roomId}
        scheduleId={schedule._id}
        createdBy={schedule.createdBy}
      />
    </Dialog>
  );
};

export default ProcessBookedModal;
