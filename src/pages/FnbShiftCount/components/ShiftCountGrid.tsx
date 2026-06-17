import { Fragment, useCallback, useMemo, useRef, type KeyboardEvent } from "react";
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

type CountField = "openingCount" | "midShiftAddition" | "closingCount";

const COUNT_COLUMN_LABELS: Record<CountField, string> = {
  openingCount: "Đầu ca",
  closingCount: "Kết ca",
  midShiftAddition: "Thêm giữa ca",
};

/** Thứ tự cột nhập trên bảng (trước các cột tính toán, trừ thêm giữa ca ở cuối) */
const PRIMARY_COUNT_COLUMNS = ["openingCount", "closingCount"] as const satisfies readonly CountField[];

/** Thứ tự Enter giữa các ô nhập */
const INPUT_NAV_ORDER = ["openingCount", "closingCount", "midShiftAddition"] as const satisfies readonly CountField[];

/** Thứ tự trái/phải trên cùng một dòng */
const ARROW_COLUMN_ORDER = INPUT_NAV_ORDER;

const inputRefKey = (itemId: string, field: CountField) => `${itemId}-${field}`;

const shouldNavigateHorizontally = (
  input: HTMLInputElement,
  key: "ArrowLeft" | "ArrowRight",
) => {
  const { selectionStart, selectionEnd, value } = input;
  if (selectionStart === null || selectionEnd === null) return true;
  if (selectionStart !== selectionEnd) return true;
  if (key === "ArrowLeft") return selectionStart === 0;
  return selectionEnd === value.length;
};

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
      field: CountField,
      value: number | "",
    ) => {
      onItemsChange(
        items.map((item) => {
          if (item.itemId !== itemId) return item;
          const nextItem = { ...item, [field]: value };
          const physicalSold = previewPhysicalSold(
            nextItem.openingCount,
            nextItem.closingCount,
            nextItem.midShiftAddition,
          );
          const variance = previewVariance(
            nextItem.openingCount,
            nextItem.closingCount,
            nextItem.systemSold,
            nextItem.midShiftAddition,
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

  const navigableRows = useMemo(
    () =>
      groupedItems
        .flatMap((group) => group.items)
        .filter((item) => !item.isParent),
    [groupedItems],
  );

  const focusCountInput = useCallback((itemId: string, field: CountField) => {
    const input = inputRefs.current[inputRefKey(itemId, field)];
    if (!input) return;
    input.focus();
    input.select();
  }, []);

  const focusNextInput = useCallback(
    (itemId: string, field: CountField) => {
      const currentIndex = navigableRows.findIndex((item) => item.itemId === itemId);
      const columnIndex = INPUT_NAV_ORDER.indexOf(field);

      if (currentIndex < 0 || columnIndex < 0) return;

      const nextColumnIndex = columnIndex + 1;
      if (nextColumnIndex < INPUT_NAV_ORDER.length) {
        focusCountInput(itemId, INPUT_NAV_ORDER[nextColumnIndex]);
        return;
      }

      const nextItem = navigableRows[currentIndex + 1];
      if (!nextItem) return;
      focusCountInput(nextItem.itemId, INPUT_NAV_ORDER[0]);
    },
    [focusCountInput, navigableRows],
  );

  const focusAdjacentInput = useCallback(
    (itemId: string, field: CountField, direction: "up" | "down" | "left" | "right") => {
      const rowIndex = navigableRows.findIndex((item) => item.itemId === itemId);
      const colIndex = ARROW_COLUMN_ORDER.indexOf(field);
      if (rowIndex < 0 || colIndex < 0) return false;

      let nextRow = rowIndex;
      let nextCol = colIndex;

      switch (direction) {
        case "up":
          nextRow -= 1;
          break;
        case "down":
          nextRow += 1;
          break;
        case "left":
          nextCol -= 1;
          break;
        case "right":
          nextCol += 1;
          break;
      }

      if (nextRow < 0 || nextRow >= navigableRows.length) return false;
      if (nextCol < 0 || nextCol >= ARROW_COLUMN_ORDER.length) return false;

      focusCountInput(navigableRows[nextRow].itemId, ARROW_COLUMN_ORDER[nextCol]);
      return true;
    },
    [focusCountInput, navigableRows],
  );

  const handleInputKeyDown = useCallback(
    (
      event: KeyboardEvent<HTMLInputElement>,
      itemId: string,
      field: CountField,
    ) => {
      if (event.key === "Enter") {
        event.preventDefault();
        focusNextInput(itemId, field);
        return;
      }

      const arrowMap = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      } as const;

      const direction = arrowMap[event.key as keyof typeof arrowMap];
      if (!direction) return;

      if (
        (direction === "left" || direction === "right") &&
        !shouldNavigateHorizontally(event.currentTarget, direction)
      ) {
        return;
      }

      if (focusAdjacentInput(itemId, field, direction)) {
        event.preventDefault();
      }
    },
    [focusAdjacentInput, focusNextInput],
  );

  const renderCountCell = (
    item: FnbShiftCountFormItem,
    field: CountField,
    isParent: boolean,
  ) => (
    <td
      key={`${item.itemId}-${field}`}
      className={cn(
        "border-b border-r p-0",
        field === "midShiftAddition" && "border-r-0",
        isParent ? "bg-muted/20" : "bg-primary/[0.03]",
      )}
    >
      {isParent ? (
        <div className="flex h-10 items-center justify-center text-muted-foreground">
          —
        </div>
      ) : editable ? (
        <Input
          ref={(element) => {
            inputRefs.current[inputRefKey(item.itemId, field)] = element;
          }}
          type="number"
          min={0}
          inputMode="numeric"
          value={item[field] === "" ? "" : item[field]}
          onChange={(event) =>
            updateItem(item.itemId, field, parseCountInput(event.target.value))
          }
          onKeyDown={(event) => handleInputKeyDown(event, item.itemId, field)}
          className="h-10 rounded-none border-0 bg-transparent text-center shadow-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
          placeholder="0"
        />
      ) : (
        <div className="flex h-10 items-center justify-center">
          {item[field] === "" ? "—" : item[field]}
        </div>
      )}
    </td>
  );

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
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="sticky left-0 top-0 z-30 w-12 border-b border-r bg-muted px-2 py-2 text-center font-semibold shadow-[1px_1px_0_0_hsl(var(--border))]">
                #
              </th>
              <th className="sticky left-12 top-0 z-30 min-w-[220px] border-b border-r bg-muted px-3 py-2 text-left font-semibold shadow-[1px_1px_0_0_hsl(var(--border))]">
                Tên món
              </th>
              {PRIMARY_COUNT_COLUMNS.map((field) => (
                <th
                  key={field}
                  className="sticky top-0 z-20 min-w-[110px] border-b border-r bg-primary/10 px-2 py-2 text-center font-semibold text-primary shadow-[0_1px_0_0_hsl(var(--border))]"
                >
                  {COUNT_COLUMN_LABELS[field]}
                </th>
              ))}
              <th className="sticky top-0 z-20 min-w-[100px] border-b border-r bg-muted px-3 py-2 text-center font-semibold shadow-[0_1px_0_0_hsl(var(--border))]">
                Bán thực tế
              </th>
              <th className="sticky top-0 z-20 min-w-[100px] border-b border-r bg-muted px-3 py-2 text-center font-semibold shadow-[0_1px_0_0_hsl(var(--border))]">
                Bán hệ thống
              </th>
              <th className="sticky top-0 z-20 min-w-[110px] border-b border-r bg-muted px-3 py-2 text-center font-semibold shadow-[0_1px_0_0_hsl(var(--border))]">
                Chênh lệch
              </th>
              <th className="sticky top-0 z-20 min-w-[110px] border-b bg-primary/10 px-2 py-2 text-center font-semibold text-primary shadow-[0_1px_0_0_hsl(var(--border))]">
                {COUNT_COLUMN_LABELS.midShiftAddition}
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
                  const isParent = !!item.isParent;
                  if (!isParent) rowNumber += 1;

                  const physicalSold = isParent
                    ? undefined
                    : item.physicalSold ??
                      previewPhysicalSold(
                        item.openingCount,
                        item.closingCount,
                        item.midShiftAddition,
                      );
                  const variance = isParent
                    ? undefined
                    : item.variance ??
                      previewVariance(
                        item.openingCount,
                        item.closingCount,
                        item.systemSold,
                        item.midShiftAddition,
                      );
                  const isShortage = isShortageVariance(variance);

                  return (
                    <tr
                      key={item.itemId}
                      className={cn(
                        "group hover:bg-muted/30",
                        isParent && "bg-muted/40 hover:bg-muted/50",
                      )}
                    >
                      <td className="sticky left-0 z-10 border-b border-r bg-background px-2 py-0 text-center text-muted-foreground group-hover:bg-muted/30">
                        {isParent ? "" : rowNumber}
                      </td>
                      <td
                        className={cn(
                          "sticky left-12 z-10 border-b border-r bg-background px-3 py-2 group-hover:bg-muted/30",
                          isParent
                            ? "font-semibold"
                            : item.isVariant
                              ? "font-medium pl-6"
                              : "font-medium",
                        )}
                      >
                        {item.itemName}
                      </td>
                      {PRIMARY_COUNT_COLUMNS.map((field) =>
                        renderCountCell(item, field, isParent),
                      )}
                      <td className="border-b border-r px-3 py-2 text-center font-medium">
                        {isParent || physicalSold === undefined
                          ? "—"
                          : physicalSold}
                      </td>
                      <td
                        className={cn(
                          "border-b border-r px-3 py-2 text-center",
                          !isParent && item.systemSold > 0
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {isParent ? "—" : item.systemSold}
                      </td>
                      <td
                        className={cn(
                          "border-b border-r px-3 py-2 text-center font-semibold",
                          isShortage &&
                            "bg-destructive/15 text-destructive",
                        )}
                      >
                        {isParent || variance === undefined
                          ? "—"
                          : formatVariance(variance)}
                      </td>
                      {renderCountCell(item, "midShiftAddition", isParent)}
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
          Mẹo: Dùng phím mũi tên hoặc Enter để chuyển giữa các ô. Ô chênh lệch
          âm (màu đỏ) nghĩa là thiếu bill trên hệ thống.
        </p>
      )}
    </div>
  );
};

export default ShiftCountGrid;
