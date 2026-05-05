import { CoffeeSessionStatus, ICoffeeSession } from "@/@types/CoffeeSession";
import {
  ICoffeeSessionOrder,
  ICoffeeSessionOrderDetail,
  ICoffeeSessionOrderSelection,
} from "@/@types/CoffeeSessionOrder";
import {
  FnBMenuCustomizationGroup,
  IFnBCustomizationGroupTemplate,
} from "@/@types/FnBCustomization";
import coffeeSessionApis from "@/apis/coffeeSession.apis";
import coffeeSessionOrderApis from "@/apis/coffeeSessionOrder.apis";
import customizationGroupTemplateApis from "@/apis/customizationGroupTemplate.apis";
import fnbMenuApis from "@/apis/fnbMenu.apis";
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
import { FnBMenuItem } from "@/hooks/use-menu-items";
import { useToast } from "@/hooks/use-toast";
import useAuth from "@/hooks/useAuth";
import CoffeeOrderEditor from "@/pages/RoomSchedule/components/CoffeeOrderEditor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import React from "react";

interface CoffeeInUseModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ICoffeeSession | null;
  tableName?: string;
  defaultOpenOrderEditor?: boolean;
}

const EMPTY_ORDER: ICoffeeSessionOrder = {
  drinks: {},
  snacks: {},
  variants: {},
};

const toLegacyOrderShape = (
  order: ICoffeeSessionOrder | undefined | null,
): ICoffeeSessionOrder => {
  if (!order) return EMPTY_ORDER;

  if (order.drinks || order.snacks) {
    return {
      drinks: order.drinks || {},
      snacks: order.snacks || {},
      variants: order.variants || {},
      lines: order.lines,
    };
  }

  if (!Array.isArray(order.lines)) return EMPTY_ORDER;

  return order.lines.reduce<ICoffeeSessionOrder>(
    (acc, line) => {
      const category = String(line.category || "").toLowerCase();
      const targetKey =
        category === "drink" || category === "drinks" ? "drinks" : "snacks";
      const itemId = String(line.itemId || "");
      const quantity = Number(line.quantity) || 0;

      if (!itemId || quantity <= 0) return acc;
      acc[targetKey][itemId] = (acc[targetKey][itemId] || 0) + quantity;
      return acc;
    },
    {
      drinks: {},
      snacks: {},
      variants: order.variants || {},
      lines: order.lines,
    },
  );
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

type SelectionDisplayGroup = {
  key: string;
  label: string;
  options: {
    key: string;
    label: string;
    priceDelta?: number;
  }[];
};

const normalizeSelectionKey = (value: string) => value.trim().toLowerCase();

const formatSelectionPrice = (priceDelta?: number) => {
  if (typeof priceDelta !== "number") return "";

  const prefix = priceDelta > 0 ? "+" : "";
  return ` (${prefix}${priceDelta.toLocaleString("vi-VN")} VND)`;
};

const getMenuItemCustomizationGroups = (
  menuItem: FnBMenuItem | undefined,
  templates: IFnBCustomizationGroupTemplate[],
): FnBMenuCustomizationGroup[] => {
  if (!menuItem) return [];

  const groups = [...(menuItem.customizationGroups || [])];

  (menuItem.customizationTemplateRefs || []).forEach((ref) => {
    const template = templates.find(
      (template) => template.templateKey === ref.templateKey,
    );

    if (template?.group) {
      groups.push(template.group);
    }
  });

  return groups;
};

const getSelectionDisplayGroups = (
  customizationGroups: FnBMenuCustomizationGroup[],
  selections?: ICoffeeSessionOrderSelection[] | null,
) => {
  if (!selections?.length) return [];

  const groups = new Map<string, SelectionDisplayGroup>();

  selections.forEach((selection) => {
    const normalizedGroupKey = normalizeSelectionKey(selection.groupKey);
    const normalizedOptionKey = normalizeSelectionKey(selection.optionKey);
    const matchedGroup = customizationGroups.find(
      (group) => normalizeSelectionKey(group.groupKey) === normalizedGroupKey,
    );
    const matchedOption = matchedGroup?.options?.find(
      (option) =>
        normalizeSelectionKey(option.optionKey) === normalizedOptionKey,
    );
    const groupLabel = matchedGroup?.label || selection.groupKey;
    const optionLabel = matchedOption?.label || selection.optionKey;
    const currentGroup = groups.get(normalizedGroupKey) || {
      key: normalizedGroupKey,
      label: groupLabel,
      options: [],
    };

    currentGroup.options.push({
      key: normalizedOptionKey,
      label: optionLabel,
      priceDelta: matchedOption?.priceDelta,
    });
    groups.set(normalizedGroupKey, currentGroup);
  });

  return Array.from(groups.values());
};

const CoffeeInUseModal: React.FC<CoffeeInUseModalProps> = ({
  isOpen,
  onClose,
  session,
  tableName,
  defaultOpenOrderEditor = false,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [peopleCount, setPeopleCount] = React.useState("1");
  const [note, setNote] = React.useState("");
  const [isOrderModalOpen, setIsOrderModalOpen] = React.useState(false);
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

  const customizationTemplatesQuery = useQuery({
    queryKey: ["customizationGroupTemplates"],
    queryFn: customizationGroupTemplateApis.getTemplates,
    select: (response) =>
      (response.data.result || []) as IFnBCustomizationGroupTemplate[],
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
    setDraftOrder(toLegacyOrderShape(orderQuery.data?.order));
  }, [orderQuery.data]);

  React.useEffect(() => {
    if (!isOpen) {
      setIsOrderModalOpen(false);
      return;
    }

    setIsOrderModalOpen(defaultOpenOrderEditor);
  }, [defaultOpenOrderEditor, isOpen]);

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
  const totalOrderItems = React.useMemo(
    () =>
      Object.values(draftOrder.drinks || {}).reduce(
        (sum, qty) => sum + (Number(qty) || 0),
        0,
      ) +
      Object.values(draftOrder.snacks || {}).reduce(
        (sum, qty) => sum + (Number(qty) || 0),
        0,
      ),
    [draftOrder.drinks, draftOrder.snacks],
  );
  const orderHistoryItems = React.useMemo(() => {
    if (orderQuery.data?.lineItems?.length) {
      return orderQuery.data.lineItems.map((item) => {
        const menuItems = menuItemsQuery.data || [];
        const menuItem = menuItems.find(
          (menuItem) => menuItem._id === item.itemId,
        );
        const hasOwnCustomizations =
          (menuItem?.customizationGroups?.length || 0) > 0 ||
          (menuItem?.customizationTemplateRefs?.length || 0) > 0;
        const selectionSourceItem = hasOwnCustomizations
          ? menuItem
          : menuItems.find(
              (sourceItem) => sourceItem._id === menuItem?.parentId,
            ) || menuItem;
        const selectionGroups = getMenuItemCustomizationGroups(
          selectionSourceItem,
          customizationTemplatesQuery.data || [],
        );

        return {
          key: item.lineId || `${item.itemId}-${item.name}`,
          name: item.name,
          quantity: item.quantity,
          category: item.category,
          note: item.note,
          selectionGroups: getSelectionDisplayGroups(
            selectionGroups,
            item.selections,
          ),
        };
      });
    }

    const legacyItems = [
      ...(orderQuery.data?.items?.drinks || []),
      ...(orderQuery.data?.items?.snacks || []),
    ];

    return legacyItems.map((item, index) => ({
      key: `${item.itemId}-${index}`,
      name: item.name,
      quantity: item.quantity,
      category: item.category,
      note: undefined,
      selectionGroups: [],
    }));
  }, [customizationTemplatesQuery.data, menuItemsQuery.data, orderQuery.data]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[94vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>In-use coffee session</DialogTitle>
            <DialogDescription>
              Bàn{" "}
              <span className="font-medium">{tableName || "Coffee table"}</span>{" "}
              đang được sử dụng. Có thể cập nhật thông tin phiên tại đây.
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

            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold">Order</h3>
                </div>
                <Badge variant="secondary">
                  {totalOrderItems > 0
                    ? `${totalOrderItems} món đã chọn`
                    : "Chưa có món"}
                </Badge>
              </div>
              {orderQuery.isLoading ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Đang tải order...
                </p>
              ) : orderHistoryItems.length > 0 ? (
                <div className="mt-3 space-y-2 rounded-md border bg-background p-3">
                  {orderHistoryItems.map((item) => (
                    <div
                      key={item.key}
                      className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-md border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {String(item.category || "")
                            .toLowerCase()
                            .startsWith("drink")
                            ? "Đồ uống"
                            : "Đồ ăn"}
                        </p>
                        {item.selectionGroups.length > 0 && (
                          <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                            {item.selectionGroups.map((group) => (
                              <p key={group.key}>
                                <span className="font-medium text-foreground">
                                  {group.label}:
                                </span>{" "}
                                {group.options
                                  .map(
                                    (option) =>
                                      `${option.label}${formatSelectionPrice(
                                        option.priceDelta,
                                      )}`,
                                  )
                                  .join(", ")}
                              </p>
                            ))}
                          </div>
                        )}
                        {item.note && (
                          <p className="mt-1 text-xs italic text-muted-foreground">
                            Ghi chú: {item.note}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant="secondary"
                        className="min-w-10 justify-center"
                      >
                        x{item.quantity}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Chưa có order cho phiên này.
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 -mx-6 flex flex-wrap justify-between gap-2 border-t bg-background px-6 py-4">
            <div className="flex flex-wrap gap-2">
              <Button
                loading={
                  updateOrderMutation.isPending || deleteOrderMutation.isPending
                }
                onClick={() => setIsOrderModalOpen(true)}
                disabled={updateSessionMutation.isPending}
              >
                Order
              </Button>
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

      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order cho admin/staff</DialogTitle>
            <DialogDescription>
              Bàn{" "}
              <span className="font-medium">{tableName || "Coffee table"}</span>{" "}
              - quản lý đồ ăn và đồ uống qua `coffee-session-orders`.
            </DialogDescription>
          </DialogHeader>

          {(orderQuery.isLoading || menuItemsQuery.isLoading) && (
            <Badge variant="secondary">Đang tải dữ liệu...</Badge>
          )}

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

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOrderModalOpen(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CoffeeInUseModal;
