import { IRoomSchedule } from "@/@types/Room";
import roomsScheduleApis from "@/apis/roomSchedule.api";
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
import dayjs from "dayjs";
import * as React from "react";
import MenuItemsModal from "@/components/modules/RoomSchedule/MenuItemsModal";
import fnbMenuApis from "@/apis/fnbMenu.apis";
import fnbOrderApis from "@/apis/fnbOrder.apis";
import { OrderDetail } from "@/@types/FnbOrder";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee, Utensils, Plus, Minus } from "lucide-react";

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
  const eventStart = dayjs(schedule.startTime);
  const eventEnd = schedule.endTime
    ? dayjs(schedule.endTime)
    : eventStart.add(120, "minute");

  // State cho thời gian điều chỉnh
  const [adjustedStartTime, setAdjustedStartTime] = React.useState<string>("");
  const [adjustedEndTime, setAdjustedEndTime] = React.useState<string>("");

  // State cho modal đặt đồ ăn
  const [isMenuModalOpen, setIsMenuModalOpen] = React.useState(false);

  const queryClient = useQueryClient();

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

  // Mutation để cập nhật số lượng
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
        await fnbOrderApis.upsertItem({
          roomScheduleId: schedule._id,
          itemId,
          quantity,
          category,
          createdBy: schedule.createdBy,
        });
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

        // Optimistically update to the new value
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

        return { previousOrderData };
      },
      onError: (_err, _variables, context) => {
        // If the mutation fails, use the context returned from onMutate to roll back
        if (context?.previousOrderData) {
          queryClient.setQueryData(
            ["fnbOrderDetail", schedule._id],
            context.previousOrderData
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
      },
    }
  );

  const menuItems = (menuItemsData?.data?.result ||
    []) as unknown as MenuItem[];

  // Khởi tạo state khi schedule thay đổi
  React.useEffect(() => {
    if (schedule) {
      setAdjustedStartTime(dayjs(schedule.startTime).format("HH:mm"));
      const defaultEnd = schedule.endTime
        ? dayjs(schedule.endTime)
        : dayjs(schedule.startTime).add(120, "minute");
      setAdjustedEndTime(defaultEnd.format("HH:mm"));
    }
  }, [schedule]);

  // Hàm xử lý tăng/giảm số lượng
  const handleQuantityChange = (
    itemId: string,
    currentQuantity: number,
    change: number,
    category: string
  ) => {
    const newQuantity = Math.max(0, currentQuantity + change);
    // Chuyển đổi category từ số nhiều sang số ít
    const normalizedCategory = category === "drinks" ? "drink" : "snack";
    updateQuantity({
      itemId,
      quantity: newQuantity,
      category: normalizedCategory,
    });
  };

  const { mutate, isPending } = useMutation({
    mutationFn: (updateData: Partial<IRoomSchedule>) =>
      roomsScheduleApis.updateSchedule(schedule._id, updateData),
    onSuccess: (_, variables) => {
      onClose();
      refetchSchedules();
      toast({
        title: "Success",
        description: `Schedule updated${
          variables.status ? " to " + variables.status : ""
        }`,
      });
    },
  });

  const handleUpdate = async (newStatus: RoomStatus) => {
    const updateData: Partial<IRoomSchedule> = { status: newStatus };

    // Nếu chuyển sang "In use", sử dụng thời gian đã điều chỉnh hoặc thời gian hiện tại
    if (newStatus === RoomStatus.InUse) {
      if (adjustedStartTime) {
        // Sử dụng thời gian đã điều chỉnh
        const datePart = dayjs(schedule.startTime).format("YYYY-MM-DD");
        const newStartTime = dayjs(`${datePart}T${adjustedStartTime}`);
        if (newStartTime.isValid()) {
          updateData.startTime = newStartTime.toISOString();
          // Thông báo cho người dùng biết đã sử dụng thời gian đã điều chỉnh
          toast({
            title: "Thời gian đã được điều chỉnh",
            description: `Sử dụng thời gian bắt đầu: ${adjustedStartTime}`,
          });
        } else {
          // Nếu thời gian không hợp lệ, sử dụng thời gian hiện tại
          updateData.startTime = dayjs().toISOString();
          toast({
            title: "Thời gian không hợp lệ",
            description: "Sử dụng thời gian hiện tại",
          });
        }
      } else {
        // Nếu chưa điều chỉnh thời gian, sử dụng thời gian hiện tại
        updateData.startTime = dayjs().toISOString();
      }
    }
    // Nếu chuyển sang "Cancelled", cập nhật endTime thành thời gian hiện tại.
    else if (newStatus === RoomStatus.Cancelled) {
      updateData.endTime = dayjs().toISOString();
    }

    // Gọi API update với dữ liệu mới (bao gồm status và thời gian)
    mutate(updateData);
  };

  // Hàm cập nhật thời gian mới dựa vào input
  const handleUpdateTime = () => {
    // Lấy phần ngày từ schedule hiện có
    const datePart = dayjs(schedule.startTime).format("YYYY-MM-DD");
    const newStartTime = dayjs(`${datePart}T${adjustedStartTime}`);
    const newEndTime = dayjs(`${datePart}T${adjustedEndTime}`);

    if (!newStartTime.isValid() || !newEndTime.isValid()) {
      toast({
        title: "Invalid time",
        description: "Please enter valid times.",
      });
      return;
    }

    if (newEndTime.isBefore(newStartTime)) {
      toast({
        title: "Invalid time",
        description: "End time must be after start time.",
      });
      return;
    }

    const updateData: Partial<IRoomSchedule> = {
      startTime: newStartTime.toISOString(),
      endTime: newEndTime.toISOString(),
    };

    mutate(updateData);
  };

  // Kiểm tra xem có order nào không
  const hasOrders =
    orderDetailData &&
    ((orderDetailData.items.drinks &&
      orderDetailData.items.drinks.length > 0) ||
      (orderDetailData.items.snacks &&
        orderDetailData.items.snacks.length > 0));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>Process Booked Event</DialogTitle>
          <DialogDescription>
            Here is the event details. You can cancel the booking, mark the
            event as in use, or adjust the event time.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <p>
            <span className="font-medium">Start:</span>{" "}
            {eventStart.format("HH:mm")}
          </p>
          <p>
            <span className="font-medium">End:</span> {eventEnd.format("HH:mm")}
          </p>
          {schedule?.note && (
            <p>
              <span className="font-medium">Note:</span> {schedule.note}
            </p>
          )}
        </div>

        {/* Hiển thị thông tin đã đặt snacks và drinks */}
        {hasOrders && (
          <div className="mt-4 space-y-2">
            <h3 className="font-semibold">Ordered Snacks & Drinks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Drinks */}
              {orderDetailData?.items.drinks &&
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
                                    "drinks"
                                  )
                                }
                                disabled={isUpdatingQuantity}
                                className="w-6 h-6 p-0"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <Badge variant="secondary">{item.quantity}</Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleQuantityChange(
                                    item.itemId,
                                    item.quantity,
                                    1,
                                    "drinks"
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
              {orderDetailData?.items.snacks &&
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
                                    "snacks"
                                  )
                                }
                                disabled={isUpdatingQuantity}
                                className="w-6 h-6 p-0"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <Badge variant="secondary">{item.quantity}</Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleQuantityChange(
                                    item.itemId,
                                    item.quantity,
                                    1,
                                    "snacks"
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

        {/* Phần điều chỉnh thời gian */}
        <div className="mt-4 space-y-2">
          <h3 className="font-semibold">Adjust Time</h3>
          <div className="flex flex-col space-y-1">
            <label htmlFor="adjustedStartTime" className="text-sm">
              Start Time:
            </label>
            <input
              id="adjustedStartTime"
              type="time"
              value={adjustedStartTime}
              onChange={(e) => setAdjustedStartTime(e.target.value)}
              className="border rounded p-1"
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label htmlFor="adjustedEndTime" className="text-sm">
              End Time:
            </label>
            <input
              id="adjustedEndTime"
              type="time"
              value={adjustedEndTime}
              onChange={(e) => setAdjustedEndTime(e.target.value)}
              className="border rounded p-1"
            />
          </div>
          <Button
            variant="default"
            onClick={handleUpdateTime}
            loading={isPending}
          >
            Update Time
          </Button>
        </div>

        <DialogFooter className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={() => setIsMenuModalOpen(true)}>
            Order Snacks & Drinks
          </Button>

          <Button
            variant="default"
            onClick={() => {
              handleUpdate(RoomStatus.InUse);
            }}
            loading={isPending}
          >
            Mark as In Use
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
          >
            Cancel Booking
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
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
