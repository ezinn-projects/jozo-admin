import type { IFnbShiftCountReportItem } from "@/apis/fnbShiftCount.apis";
import type { FnBMenuItem } from "@/hooks/use-menu-items";
import type { FnbShiftCountFormItem } from "./types";

export const toFormItem = (item: IFnbShiftCountReportItem): FnbShiftCountFormItem => ({
  itemId: item.itemId,
  itemName: item.itemName,
  category: item.category,
  isParent: false,
  isVariant: false,
  openingCount:
    item.openingCount === undefined || item.openingCount === null
      ? ""
      : item.openingCount,
  midShiftAddition:
    item.midShiftAddition === undefined || item.midShiftAddition === null
      ? ""
      : item.midShiftAddition,
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
  const midShiftAddition =
    saved.midShiftAddition === undefined || saved.midShiftAddition === null
      ? base.midShiftAddition
      : saved.midShiftAddition;
  const closingCount =
    saved.closingCount === undefined || saved.closingCount === null
      ? base.closingCount
      : saved.closingCount;

  return {
    ...base,
    itemName: saved.itemName || base.itemName,
    category: saved.category || base.category,
    openingCount,
    midShiftAddition,
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

const getVariantsForParent = (
  parent: FnBMenuItem,
  menuItems: FnBMenuItem[],
): FnBMenuItem[] => {
  if (parent.variants?.length) {
    return parent.variants.map((variant) => ({
      ...variant,
      parentId: variant.parentId ?? parent._id ?? null,
    }));
  }

  return menuItems.filter((item) => item.parentId === parent._id);
};

const buildCountableFormItem = (
  menuItem: FnBMenuItem,
  itemName: string,
  countMap: Map<string, IFnbShiftCountReportItem>,
  isVariant = false,
): FnbShiftCountFormItem => {
  const saved = countMap.get(menuItem._id!);
  const base: FnbShiftCountFormItem = {
    itemId: menuItem._id!,
    itemName,
    category: normalizeMenuCategory(menuItem.category),
    isParent: false,
    isVariant,
    openingCount: "",
    midShiftAddition: "",
    closingCount: "",
    systemSold: 0,
  };

  return overlayShiftCountData(base, saved);
};

export const mergeMenuWithShiftCount = (
  menuItems: FnBMenuItem[],
  shiftCountItems?: IFnbShiftCountReportItem[],
): FnbShiftCountFormItem[] => {
  const countMap = new Map(
    (shiftCountItems ?? []).map((item) => [item.itemId, item]),
  );
  const mergedFromMenu: FnbShiftCountFormItem[] = [];
  const countableIds = new Set<string>();

  const sortByName = (a: FnBMenuItem, b: FnBMenuItem) =>
    a.name.localeCompare(b.name, "vi");

  const topLevelItems = menuItems
    .filter((item) => !!item._id && !item.parentId)
    .sort((a, b) => {
      const categoryOrder =
        CATEGORY_ORDER.indexOf(normalizeMenuCategory(a.category)) -
        CATEGORY_ORDER.indexOf(normalizeMenuCategory(b.category));
      if (categoryOrder !== 0) return categoryOrder;
      return sortByName(a, b);
    });

  const parentItems = topLevelItems.filter((item) => item.hasVariant);
  const standaloneItems = topLevelItems.filter((item) => !item.hasVariant);

  for (const item of parentItems) {
    const variants = getVariantsForParent(item, menuItems)
      .filter((variant) => !!variant._id)
      .sort(sortByName);

    if (variants.length === 0) continue;

    mergedFromMenu.push({
      itemId: item._id!,
      itemName: item.name,
      category: normalizeMenuCategory(item.category),
      isParent: true,
      isVariant: false,
      openingCount: "",
      midShiftAddition: "",
      closingCount: "",
      systemSold: 0,
    });

    for (const variant of variants) {
      mergedFromMenu.push(
        buildCountableFormItem(variant, variant.name, countMap, true),
      );
      countableIds.add(variant._id!);
    }
  }

  for (const item of standaloneItems) {
    mergedFromMenu.push(buildCountableFormItem(item, item.name, countMap, false));
    countableIds.add(item._id!);
  }

  const orphanSavedItems = (shiftCountItems ?? [])
    .filter((item) => !countableIds.has(item.itemId))
    .map(toFormItem);

  return [...mergedFromMenu, ...orphanSavedItems];
};

export const previewPhysicalSold = (
  openingCount: number | "",
  closingCount: number | "",
  midShiftAddition: number | "" = "",
): number | undefined => {
  if (openingCount === "" || closingCount === "") return undefined;
  const addition = midShiftAddition === "" ? 0 : midShiftAddition;
  return openingCount + addition - closingCount;
};

export const previewVariance = (
  openingCount: number | "",
  closingCount: number | "",
  systemSold: number,
  midShiftAddition: number | "" = "",
): number | undefined => {
  const physicalSold = previewPhysicalSold(
    openingCount,
    closingCount,
    midShiftAddition,
  );
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
