import {
  ICoffeeSessionOrderDetail,
  ICoffeeSessionOrderLineItem,
  ICoffeeSessionOrderSelection,
} from "@/@types/CoffeeSessionOrder";
import { IFnBCustomizationGroupTemplate } from "@/@types/FnBCustomization";
import coffeeSessionOrderApis from "@/apis/coffeeSessionOrder.apis";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { FnBMenuItem } from "@/hooks/use-menu-items";
import { useToast } from "@/hooks/use-toast";
import { mergeAggregatedIntoDetail } from "@/utils/coffeeSessionOrderBatch";
import {
  formatSelectionPrice,
  getLineItemCustomizationGroups,
  LineItemSelectionState,
  normalizeSelectionKey,
  selectionsToState,
  stateToSelections,
  validateSelectionState,
} from "@/utils/coffeeOrderLineItemSelections";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, X } from "lucide-react";
import React from "react";

export type CoffeeOrderLineItemEditorTarget = {
  batchId: string;
  lineItem: ICoffeeSessionOrderLineItem;
};

type CoffeeOrderLineItemEditorDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  target: CoffeeOrderLineItemEditorTarget | null;
  coffeeSessionId?: string;
  menuItems: FnBMenuItem[];
  templates: IFnBCustomizationGroupTemplate[];
  updatedBy?: string;
};

const CoffeeOrderLineItemEditorDialog: React.FC<
  CoffeeOrderLineItemEditorDialogProps
> = ({
  isOpen,
  onClose,
  target,
  coffeeSessionId,
  menuItems,
  templates,
  updatedBy,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = React.useState(1);
  const [note, setNote] = React.useState("");
  const [selectionState, setSelectionState] =
    React.useState<LineItemSelectionState>({});
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);

  const lineItem = target?.lineItem;
  const customizationGroups = React.useMemo(
    () =>
      lineItem
        ? getLineItemCustomizationGroups(lineItem, menuItems, templates)
        : [],
    [lineItem, menuItems, templates],
  );

  React.useEffect(() => {
    if (!isOpen || !lineItem) return;

    setQuantity(Math.max(1, Number(lineItem.quantity) || 1));
    setNote(lineItem.note || "");
    setSelectionState(selectionsToState(lineItem.selections));
    setValidationErrors([]);
  }, [isOpen, lineItem]);

  const updateLineMutation = useMutation({
    mutationFn: (payload: {
      quantity: number;
      selections: ICoffeeSessionOrderSelection[];
      note: string | null;
    }) => {
      if (!coffeeSessionId || !target) {
        throw new Error("Thiếu thông tin phiên hoặc dòng order.");
      }

      return coffeeSessionOrderApis.updateCoffeeSessionOrderBatchLine(
        coffeeSessionId,
        target.batchId,
        lineItem?.lineId || "",
        {
          quantity: payload.quantity,
          selections: payload.selections,
          note: payload.note,
          updatedBy,
        },
      );
    },
    onSuccess: (response) => {
      const sid = coffeeSessionId;
      const result = response.data.result;
      if (sid && result) {
        queryClient.setQueryData<ICoffeeSessionOrderDetail | null>(
          ["coffeeSessionOrder", sid],
          (old) => {
            if (!old) return old;

            const nextDetail = result.aggregatedOrder
              ? mergeAggregatedIntoDetail(old, result.aggregatedOrder)
              : old;

            if (!old.batches?.length) {
              return nextDetail;
            }

            return {
              ...nextDetail,
              batches: old.batches.map((batch) =>
                batch.batchId === result.batch.batchId ? result.batch : batch,
              ),
            };
          },
        );
      }

      queryClient.invalidateQueries({
        queryKey: ["coffeeSessionOrder", coffeeSessionId],
      });
      toast({
        title: "Đã cập nhật món",
        description: "Tuỳ chọn và ghi chú đã được lưu.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Không thể cập nhật món",
        description: error.message || "Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const setGroupOptions = (groupKey: string, optionKeys: string[]) => {
    setSelectionState((prev) => ({
      ...prev,
      [groupKey]: optionKeys,
    }));
    setValidationErrors([]);
  };

  const toggleMultiOption = (
    groupKey: string,
    optionKey: string,
    maxSelect: number,
    checked: boolean,
  ) => {
    const current = selectionState[groupKey] || [];
    const next = checked
      ? current.includes(optionKey)
        ? current
        : [...current, optionKey].slice(-maxSelect)
      : current.filter((key) => key !== optionKey);

    setGroupOptions(groupKey, next);
  };

  const removeOption = (groupKey: string, optionKey: string) => {
    const current = selectionState[groupKey] || [];
    setGroupOptions(
      groupKey,
      current.filter((key) => key !== optionKey),
    );
  };

  const handleSave = () => {
    const validation = validateSelectionState(
      selectionState,
      customizationGroups,
    );
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    const selections = stateToSelections(selectionState, customizationGroups);
    updateLineMutation.mutate({
      quantity: Math.max(1, quantity),
      selections,
      note: note.trim() || null,
    });
  };

  const hasCustomizations = customizationGroups.length > 0;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh món đã order</DialogTitle>
          <DialogDescription>
            Đổi hoặc bỏ tuỳ chọn khi hết hàng, thêm ghi chú cho khách.
          </DialogDescription>
        </DialogHeader>

        {lineItem ? (
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/20 p-3">
              <p className="font-medium">{lineItem.name}</p>
              <p className="text-xs text-muted-foreground">
                Đợt: {target?.batchId}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Label>Số lượng</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={quantity <= 1 || updateLineMutation.isPending}
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                >
                  -
                </Button>
                <Badge variant="secondary" className="min-w-10 justify-center">
                  {quantity}
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={updateLineMutation.isPending}
                  onClick={() => setQuantity((prev) => prev + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            {hasCustomizations ? (
              <div className="space-y-4">
                <p className="text-sm font-medium">Tuỳ chọn</p>
                {customizationGroups.map((group) => {
                  const groupKey = normalizeSelectionKey(group.groupKey);
                  const selected = selectionState[groupKey] || [];
                  const isSingleSelect = group.maxSelect <= 1;

                  return (
                    <div
                      key={groupKey}
                      className="space-y-2 rounded-md border p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">{group.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {group.minSelect > 0
                            ? `Chọn ${group.minSelect}`
                            : "Tuỳ chọn"}
                          {group.maxSelect > 1
                            ? ` – tối đa ${group.maxSelect}`
                            : ""}
                        </p>
                      </div>

                      {selected.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selected.map((optionKey) => {
                            const option = group.options.find(
                              (item) =>
                                normalizeSelectionKey(item.optionKey) ===
                                optionKey,
                            );
                            if (!option) return null;

                            return (
                              <Badge
                                key={optionKey}
                                variant="secondary"
                                className="gap-1 pr-1"
                              >
                                {option.label}
                                {formatSelectionPrice(option.priceDelta)}
                                <button
                                  type="button"
                                  className="rounded-sm p-0.5 hover:bg-muted"
                                  aria-label={`Bỏ ${option.label}`}
                                  onClick={() =>
                                    removeOption(groupKey, optionKey)
                                  }
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-amber-700">
                          Chưa chọn — có thể bỏ hết nếu khách đồng ý.
                        </p>
                      )}

                      {isSingleSelect ? (
                        <RadioGroup
                          value={selected[0] || ""}
                          onValueChange={(value) =>
                            setGroupOptions(groupKey, value ? [value] : [])
                          }
                        >
                          {group.options.map((option) => {
                            const optionKey = normalizeSelectionKey(
                              option.optionKey,
                            );
                            return (
                              <label
                                key={optionKey}
                                className="flex cursor-pointer items-center gap-2 text-sm"
                              >
                                <RadioGroupItem value={optionKey} />
                                <span>
                                  {option.label}
                                  {formatSelectionPrice(option.priceDelta)}
                                </span>
                              </label>
                            );
                          })}
                        </RadioGroup>
                      ) : (
                        <div className="space-y-2">
                          {group.options.map((option) => {
                            const optionKey = normalizeSelectionKey(
                              option.optionKey,
                            );
                            const checked = selected.includes(optionKey);
                            const disabled =
                              !checked && selected.length >= group.maxSelect;

                            return (
                              <label
                                key={optionKey}
                                className="flex cursor-pointer items-center gap-2 text-sm"
                              >
                                <Checkbox
                                  checked={checked}
                                  disabled={disabled}
                                  onCheckedChange={(value) =>
                                    toggleMultiOption(
                                      groupKey,
                                      optionKey,
                                      group.maxSelect,
                                      value === true,
                                    )
                                  }
                                />
                                <span>
                                  {option.label}
                                  {formatSelectionPrice(option.priceDelta)}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Món này không có nhóm tuỳ chọn.
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="line-item-note">Ghi chú cho khách</Label>
              <Textarea
                id="line-item-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="VD: Trân châu hết, đã bỏ topping theo yêu cầu khách"
              />
            </div>

            {validationErrors.length > 0 ? (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <div className="mb-1 flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  Cần chỉnh lại tuỳ chọn
                </div>
                <ul className="list-disc space-y-1 pl-5">
                  {validationErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={updateLineMutation.isPending}
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button
            type="button"
            loading={updateLineMutation.isPending}
            disabled={!lineItem || !coffeeSessionId || updateLineMutation.isPending}
            onClick={handleSave}
          >
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CoffeeOrderLineItemEditorDialog;
