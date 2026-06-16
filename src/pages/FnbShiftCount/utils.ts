import type { IFnbShiftCountReportItem } from "@/apis/fnbShiftCount.apis";
import type { FnBMenuItem } from "@/hooks/use-menu-items";
import type { FnbShiftCountFormItem } from "./types";

export const toFormItem = (item: IFnbShiftCountReportItem): FnbShiftCountFormItem => ({
  itemId: item.itemId,
  itemName: item.itemName,
  category: item.category,
  openingCount:
    item.openingCount === undefined || item.openingCount === null
      ? ""
      : item.openingCount,
  closingCount:
    item.closingCount === undefined || item.closingCount === null
      ? ""
      : item.closingCount,
  physicalSold: item.physicalSold,
  systemSold: item.systemSold ?? 0,
  variance: item.variance,
});

const overlayShiftCountData = (
  base: FnbShiftCountFormItem,
  saved?: IFnbShiftCountReportItem,
): FnbShiftCountFormItem => {
  if (!saved) return base;

  const openingCount =
    saved.openingCount === undefined || saved.openingCount === null
      ? base.openingCount
      : saved.openingCount;
  const closingCount =
    saved.closingCount === undefined || saved.closingCount === null
      ? base.closingCount
      : saved.closingCount;

  return {
    ...base,
    itemName: saved.itemName || base.itemName,
    category: saved.category || base.category,
    openingCount,
    closingCount,
    physicalSold: saved.physicalSold ?? base.physicalSold,
    systemSold: saved.systemSold ?? 0,
    variance: saved.variance ?? base.variance,
  };
};

const normalizeMenuCategory = (
  category: string,
): FnbShiftCountFormItem["category"] => {
  const lower = category.toLowerCase();
  if (lower === "drink" || lower === "drinks") return "drink";
  return "snack";
};

const getMenuItemDisplayName = (
  menuItem: FnBMenuItem,
  menuItems: FnBMenuItem[],
): string => {
  if (!menuItem.parentId) return menuItem.name;
  const parent = menuItems.find((item) => item._id === menuItem.parentId);
  return parent ? `${parent.name} - ${menuItem.name}` : menuItem.name;
};

/** Món cần kiểm kê: biến thể hoặc món độc lập (không phải parent chỉ để gom variant). */
export const getCountableMenuItems = (menuItems: FnBMenuItem[]): FnBMenuItem[] =>
  menuItems.filter((item) => !!item._id && (!!item.parentId || !item.hasVariant));

export const mergeMenuWithShiftCount = (
  menuItems: FnBMenuItem[],
  shiftCountItems?: IFnbShiftCountReportItem[],
): FnbShiftCountFormItem[] => {
  const countMap = new Map(
    (shiftCountItems ?? []).map((item) => [item.itemId, item]),
  );
  const countableMenuItems = getCountableMenuItems(menuItems);
  const mergedFromMenu = countableMenuItems.map((menuItem) => {
    const saved = countMap.get(menuItem._id!);
    const base: FnbShiftCountFormItem = {
      itemId: menuItem._id!,
      itemName: getMenuItemDisplayName(menuItem, menuItems),
      category: normalizeMenuCategory(menuItem.category),
      openingCount: "",
      closingCount: "",
      systemSold: 0,
    };

    return overlayShiftCountData(base, saved);
  });

  const menuIds = new Set(countableMenuItems.map((item) => item._id));
  const orphanSavedItems = (shiftCountItems ?? [])
    .filter((item) => !menuIds.has(item.itemId))
    .map(toFormItem);

  return [...mergedFromMenu, ...orphanSavedItems].sort((a, b) => {
    const categoryOrder =
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    if (categoryOrder !== 0) return categoryOrder;
    return a.itemName.localeCompare(b.itemName, "vi");
  });
};

export const previewPhysicalSold = (
  openingCount: number | "",
  closingCount: number | "",
): number | undefined => {
  if (openingCount === "" || closingCount === "") return undefined;
  return openingCount - closingCount;
};

export const previewVariance = (
  openingCount: number | "",
  closingCount: number | "",
  systemSold: number,
): number | undefined => {
  const physicalSold = previewPhysicalSold(openingCount, closingCount);
  if (physicalSold === undefined) return undefined;
  return systemSold - physicalSold;
};

/** Chênh lệch âm = bán thực tế > bán hệ thống → thiếu bill */
export const isShortageVariance = (variance: number | undefined): boolean =>
  variance !== undefined && variance < 0;

export const formatVariance = (variance: number): string => {
  if (variance > 0) return `+${variance}`;
  return String(variance);
};

export const parseCountInput = (value: string): number | "" => {
  const trimmed = value.trim();
  if (trimmed === "") return "";
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return "";
  return Math.floor(parsed);
};

export const CATEGORY_LABELS: Record<string, string> = {
  drink: "Đồ uống",
  snack: "Đồ ăn",
};

export const CATEGORY_ORDER = ["drink", "snack"] as const;
