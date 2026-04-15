import { CoffeeSessionStatus, ICoffeeSession } from "@/@types/CoffeeSession";
import {
  ICoffeeSessionOrder,
  ICoffeeSessionOrderDetail,
} from "@/@types/CoffeeSessionOrder";
import coffeeSessionApis from "@/apis/coffeeSession.apis";
import coffeeSessionOrderApis from "@/apis/coffeeSessionOrder.apis";
import fnbMenuApis from "@/apis/fnbMenu.apis";
import CoffeeOrderEditor from "@/pages/RoomSchedule/components/CoffeeOrderEditor";
import { FnBMenuItem } from "@/hooks/use-menu-items";
import useAuth from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import React from "react";

interface CoffeeInUseModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ICoffeeSession | null;
  tableName?: string;
}

const EMPTY_ORDER: ICoffeeSessionOrder = {
  drinks: {},
  snacks: {},
  variants: {},
};

const sanitizeOrder = (order: ICoffeeSessionOrder): ICoffeeSessionOrder => ({
  drinks: Object.fromEntries(
    Object.entries(order.drinks || {}).filter(([, quantity]) => quantity > 0),
  ),
  snacks: Object.fromEntries(
    Object.entries(order.snacks || {}).filter(([, quantity]) => quantity > 0),
  ),
  variants: Object.fromEntries(
    Object.entries(order.variants || {}).filter(([, values]) =>
      Object.values(values || {}).some((quantity) => quantity > 0),
    ),
  ),
});

const CoffeeInUseModal: React.FC<CoffeeInUseModalProps> = ({
  isOpen,
  onClose,
  session,
  tableName,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [peopleCount, setPeopleCount] = React.useState("1");
  const [note, setNote] = React.useState("");
  const [draftOrder, setDraftOrder] =
    React.useState<ICoffeeSessionOrder>(EMPTY_ORDER);
  const sessionDetailQuery = useQuery({
    queryKey: ["coffeeSession", session?._id],
    queryFn: async () => {
      if (!session?._id) return null;
      const response = await coffeeSessionApis.getCoffeeSessionById(
        session._id,
      );
      return (response.data.result || null) as ICoffeeSession | null;
    },
    enabled: isOpen && !!session?._id,
    refetchOnWindowFocus: false,
  });
  const sessionDetail = sessionDetailQuery.data || session;

  React.useEffect(() => {
    setCustomerName(sessionDetail?.customerName || "");
    setCustomerPhone(sessionDetail?.customerPhone || "");
    setPeopleCount(String(sessionDetail?.peopleCount || 1));
    setNote(sessionDetail?.note || "");
  }, [sessionDetail]);

  const menuItemsQuery = useQuery({
    queryKey: ["menuItems"],
    queryFn: fnbMenuApis.getAllMenuItems,
    select: (response) => (response.data.result || []) as FnBMenuItem[],
    enabled: isOpen,
  });

  const orderQuery = useQuery({
    queryKey: ["coffeeSessionOrder", sessionDetail?._id],
    queryFn: async () => {
      if (!sessionDetail?._id) return null;
      const response = await coffeeSessionOrderApis.getCoffeeSessionOrder(
        sessionDetail._id,
      );
      return (response.data.result || null) as ICoffeeSessionOrderDetail | null;
    },
    enabled: isOpen && !!sessionDetail?._id,
    refetchOnWindowFocus: false,
  });

  React.useEffect(() => {
    setDraftOrder(orderQuery.data?.order || EMPTY_ORDER);
  }, [orderQuery.data]);

  const updateSessionMutation = useMutation({
    mutationFn: (status: CoffeeSessionStatus) =>
      coffeeSessionApis.updateCoffeeSession(sessionDetail?._id || "", {
        status,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        peopleCount: Math.max(1, Number(peopleCount) || 1),
        note: note.trim() || undefined,
      }),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ["coffeeSessions"] });
      queryClient.invalidateQueries({
        queryKey: ["coffeeSession", sessionDetail?._id],
      });
      toast({
        title: "Cập nhật phiên thành công",
        description:
          status === "completed"
            ? "Phiên đã được hoàn tất."
            : "Đã lưu thông tin phiên đang sử dụng.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Không thể cập nhật phiên",
        description: error.message || "Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: (nextOrder: ICoffeeSessionOrder) =>
      coffeeSessionOrderApis.updateCoffeeSessionOrder(
        sessionDetail?._id || "",
        {
          order: sanitizeOrder(nextOrder),
          updatedBy: user?._id,
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["coffeeSessionOrder", sessionDetail?._id],
      });
      toast({
        title: "Cập nhật order thành công",
        description: "Order của phiên đã được đồng bộ.",
      });
    },
    onError: (error) => {
      setDraftOrder(orderQuery.data?.order || EMPTY_ORDER);
      toast({
        title: "Không thể cập nhật order",
        description: error.message || "Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: () =>
      coffeeSessionOrderApis.deleteCoffeeSessionOrder(sessionDetail?._id || ""),
    onSuccess: () => {
      setDraftOrder(EMPTY_ORDER);
      queryClient.invalidateQueries({
        queryKey: ["coffeeSessionOrder", sessionDetail?._id],
      });
      toast({
        title: "Đã xóa order",
        description: "Order của phiên đã được xóa.",
      });
    },
    onError: (error) => {
      toast({
        title: "Không thể xóa order",
        description: error.message || "Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const handleQuantityChange = (item: FnBMenuItem, nextQuantity: number) => {
    const category = item.category.toLowerCase();
    const targetKey =
      category === "drink" || category === "drinks" ? "drinks" : "snacks";

    const nextOrder: ICoffeeSessionOrder = {
      ...draftOrder,
      [targetKey]: {
        ...(draftOrder[targetKey] || {}),
        [item._id || ""]: nextQuantity,
      },
    };

    if (nextQuantity <= 0) {
      delete nextOrder[targetKey][item._id || ""];
    }

    setDraftOrder(nextOrder);
    updateOrderMutation.mutate(nextOrder);
  };

  const planSnapshot = sessionDetail?.planSnapshot;
  const startedAt = sessionDetail?.startTime || sessionDetail?.createdAt;
  const usageDurationMinutes = sessionDetail?.usageDurationMinutes;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[94vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>In-use coffee session</DialogTitle>
          <DialogDescription>
            Bàn{" "}
            <span className="font-medium">{tableName || "Coffee table"}</span>{" "}
            đang được sử dụng. Có thể cập nhật thông tin phiên và quản lý order
            ngay tại đây.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center gap-2">
                <Badge variant="default">In use</Badge>
                {sessionDetailQuery.isLoading && (
                  <Badge variant="secondary">Đang tải chi tiết...</Badge>
                )}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Bắt đầu sử dụng
              </p>
              <p className="font-medium">
                {startedAt
                  ? dayjs(startedAt).format("HH:mm DD/MM/YYYY")
                  : "Chưa có"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">PIN code</p>
              <p className="font-mono text-base font-semibold tracking-widest">
                {sessionDetail?.pinCode || "Chưa có"}
              </p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Giá snapshot</p>
              <p className="font-medium">
                {planSnapshot?.pricePerPerson
                  ? `${planSnapshot.pricePerPerson.toLocaleString("vi-VN")} ${
                      planSnapshot.currency || "VND"
                    }/người`
                  : "Backend chưa trả snapshot giá"}
              </p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">
                Tổng snapshot / thời lượng
              </p>
              <p className="font-medium">
                {planSnapshot?.totalPrice
                  ? `${planSnapshot.totalPrice.toLocaleString("vi-VN")} ${
                      planSnapshot.currency || "VND"
                    }`
                  : `${peopleCount || "1"} người`}
              </p>
              {typeof usageDurationMinutes === "number" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Đã dùng: {usageDurationMinutes} phút
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="in-use-customer-name">Tên khách</Label>
              <Input
                id="in-use-customer-name"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Nhập tên khách"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="in-use-customer-phone">Số điện thoại</Label>
              <Input
                id="in-use-customer-phone"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                placeholder="Nhập số điện thoại"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="in-use-people-count">Số người</Label>
            <Input
              id="in-use-people-count"
              type="number"
              min={1}
              value={peopleCount}
              onChange={(event) => setPeopleCount(event.target.value)}
              placeholder="Nhập số người"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="in-use-note">Ghi chú</Label>
            <Textarea
              id="in-use-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ghi chú thêm cho ca sử dụng"
            />
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold">Order của phiên</h3>
                <p className="text-sm text-muted-foreground">
                  Quản lý đồ ăn và đồ uống qua `coffee-session-orders`.
                </p>
              </div>
              {(orderQuery.isLoading || menuItemsQuery.isLoading) && (
                <Badge variant="secondary">Đang tải dữ liệu...</Badge>
              )}
            </div>

            <CoffeeOrderEditor
              menuItems={menuItemsQuery.data || []}
              order={draftOrder}
              orderDetail={orderQuery.data}
              isUpdating={
                updateOrderMutation.isPending || deleteOrderMutation.isPending
              }
              onQuantityChange={handleQuantityChange}
              onClearOrder={() => deleteOrderMutation.mutate()}
            />
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 -mx-6 flex flex-wrap justify-between gap-2 border-t bg-background px-6 py-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              loading={updateSessionMutation.isPending}
              onClick={() => updateSessionMutation.mutate("in-use")}
            >
              Lưu thông tin
            </Button>
            <Button
              variant="secondary"
              loading={updateSessionMutation.isPending}
              onClick={() => updateSessionMutation.mutate("completed")}
            >
              Kết thúc phiên
            </Button>
          </div>

          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CoffeeInUseModal;
