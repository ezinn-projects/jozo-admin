import { Fragment, useCallback, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { FnbShiftCountFormItem } from "../types";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  formatVariance,
  isShortageVariance,
  parseCountInput,
  previewPhysicalSold,
  previewVariance,
} from "../utils";

interface ShiftCountGridProps {
  items: FnbShiftCountFormItem[];
  note: string;
  editable: boolean;
  search: string;
  isLoading?: boolean;
  onItemsChange: (items: FnbShiftCountFormItem[]) => void;
  onNoteChange: (note: string) => void;
}

const COUNT_COLUMNS = ["openingCount", "closingCount"] as const;

const ShiftCountGrid = ({
  items,
  note,
  editable,
  search,
  isLoading,
  onItemsChange,
  onNoteChange,
}: ShiftCountGridProps) => {
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) =>
      item.itemName.toLowerCase().includes(keyword),
    );
  }, [items, search]);

  const groupedItems = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      label: CATEGORY_LABELS[category],
      items: filteredItems.filter((item) => item.category === category),
    })).filter((group) => group.items.length > 0);
  }, [filteredItems]);

  const updateItem = useCallback(
    (
      itemId: string,
      field: "openingCount" | "closingCount",
      value: number | "",
    ) => {
      onItemsChange(
        items.map((item) => {
          if (item.itemId !== itemId) return item;
          const nextItem = { ...item, [field]: value };
          const physicalSold = previewPhysicalSold(
            nextItem.openingCount,
            nextItem.closingCount,
          );
          const variance = previewVariance(
            nextItem.openingCount,
            nextItem.closingCount,
            nextItem.systemSold,
          );
          return {
            ...nextItem,
            physicalSold,
            variance,
          };
        }),
      );
    },
    [items, onItemsChange],
  );

  const focusNextInput = (itemId: string, field: (typeof COUNT_COLUMNS)[number]) => {
    const flatItems = groupedItems.flatMap((group) => group.items);
    const currentIndex = flatItems.findIndex((item) => item.itemId === itemId);
    const columnIndex = COUNT_COLUMNS.indexOf(field);

    if (currentIndex < 0) return;

    const nextColumnIndex = columnIndex + 1;
    if (nextColumnIndex < COUNT_COLUMNS.length) {
      const nextField = COUNT_COLUMNS[nextColumnIndex];
      inputRefs.current[`${itemId}-${nextField}`]?.focus();
      inputRefs.current[`${itemId}-${nextField}`]?.select();
      return;
    }

    const nextItem = flatItems[currentIndex + 1];
    if (!nextItem) return;
    const nextField = COUNT_COLUMNS[0];
    inputRefs.current[`${nextItem.itemId}-${nextField}`]?.focus();
    inputRefs.current[`${nextItem.itemId}-${nextField}`]?.select();
  };

  let rowNumber = 0;

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-md border">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (groupedItems.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-md border text-sm text-muted-foreground">
        Không có món phù hợp với bộ lọc.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="max-h-[min(70vh,720px)] overflow-auto rounded-md border shadow-sm">
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="sticky left-0 top-0 z-30 w-12 border-b border-r bg-muted px-2 py-2 text-center font-semibold shadow-[1px_1px_0_0_hsl(var(--border))]">
                #
              </th>
              <th className="sticky left-12 top-0 z-30 min-w-[220px] border-b border-r bg-muted px-3 py-2 text-left font-semibold shadow-[1px_1px_0_0_hsl(var(--border))]">
                Tên món
              </th>
              <th className="sticky top-0 z-20 min-w-[100px] border-b border-r bg-muted px-3 py-2 text-center font-semibold shadow-[0_1px_0_0_hsl(var(--border))]">
                Danh mục
              </th>
              <th className="sticky top-0 z-20 min-w-[110px] border-b border-r bg-primary/10 px-2 py-2 text-center font-semibold text-primary shadow-[0_1px_0_0_hsl(var(--border))]">
                Đầu ca
              </th>
              <th className="sticky top-0 z-20 min-w-[110px] border-b border-r bg-primary/10 px-2 py-2 text-center font-semibold text-primary shadow-[0_1px_0_0_hsl(var(--border))]">
                Kết ca
              </th>
              <th className="sticky top-0 z-20 min-w-[100px] border-b border-r bg-muted px-3 py-2 text-center font-semibold shadow-[0_1px_0_0_hsl(var(--border))]">
                Bán thực tế
              </th>
              <th className="sticky top-0 z-20 min-w-[100px] border-b border-r bg-muted px-3 py-2 text-center font-semibold shadow-[0_1px_0_0_hsl(var(--border))]">
                Bán hệ thống
              </th>
              <th className="sticky top-0 z-20 min-w-[110px] border-b bg-muted px-3 py-2 text-center font-semibold shadow-[0_1px_0_0_hsl(var(--border))]">
                Chênh lệch
              </th>
            </tr>
          </thead>
          <tbody>
            {groupedItems.map((group) => (
              <Fragment key={group.category}>
                <tr className="bg-accent/40">
                  <td
                    colSpan={8}
                    className="sticky left-0 z-10 border-b px-3 py-2 text-left text-xs font-bold uppercase tracking-wide"
                  >
                    {group.label}
                  </td>
                </tr>
                {group.items.map((item) => {
                  rowNumber += 1;
                  const physicalSold =
                    item.physicalSold ??
                    previewPhysicalSold(item.openingCount, item.closingCount);
                  const variance =
                    item.variance ??
                    previewVariance(
                      item.openingCount,
                      item.closingCount,
                      item.systemSold,
                    );
                  const isShortage = isShortageVariance(variance);

                  return (
                    <tr
                      key={item.itemId}
                      className="group hover:bg-muted/30"
                    >
                      <td className="sticky left-0 z-10 border-b border-r bg-background px-2 py-0 text-center text-muted-foreground group-hover:bg-muted/30">
                        {rowNumber}
                      </td>
                      <td className="sticky left-12 z-10 border-b border-r bg-background px-3 py-2 font-medium group-hover:bg-muted/30">
                        {item.itemName}
                      </td>
                      <td className="border-b border-r px-3 py-2 text-center text-muted-foreground">
                        {CATEGORY_LABELS[item.category]}
                      </td>
                      {COUNT_COLUMNS.map((field) => (
                        <td
                          key={`${item.itemId}-${field}`}
                          className="border-b border-r bg-primary/[0.03] p-0"
                        >
                          {editable ? (
                            <Input
                              ref={(element) => {
                                inputRefs.current[`${item.itemId}-${field}`] =
                                  element;
                              }}
                              type="number"
                              min={0}
                              inputMode="numeric"
                              value={item[field] === "" ? "" : item[field]}
                              onChange={(event) =>
                                updateItem(
                                  item.itemId,
                                  field,
                                  parseCountInput(event.target.value),
                                )
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  focusNextInput(item.itemId, field);
                                }
                              }}
                              className="h-10 rounded-none border-0 bg-transparent text-center shadow-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                              placeholder="0"
                            />
                          ) : (
                            <div className="flex h-10 items-center justify-center">
                              {item[field] === "" ? "—" : item[field]}
                            </div>
                          )}
                        </td>
                      ))}
                      <td className="border-b border-r px-3 py-2 text-center font-medium">
                        {physicalSold === undefined ? "—" : physicalSold}
                      </td>
                      <td
                        className={cn(
                          "border-b border-r px-3 py-2 text-center",
                          item.systemSold > 0
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {item.systemSold}
                      </td>
                      <td
                        className={cn(
                          "border-b px-3 py-2 text-center font-semibold",
                          isShortage &&
                            "bg-destructive/15 text-destructive",
                        )}
                      >
                        {variance === undefined ? "—" : formatVariance(variance)}
                      </td>
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Ghi chú</label>
        <Textarea
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="Ghi chú thêm về ca làm việc..."
          disabled={!editable}
          rows={3}
        />
      </div>

      {editable && (
        <p className="text-xs text-muted-foreground">
          Mẹo: Nhấn Enter để chuyển sang ô tiếp theo. Ô chênh lệch âm (màu đỏ)
          nghĩa là thiếu bill trên hệ thống.
        </p>
      )}
    </div>
  );
};

export default ShiftCountGrid;
