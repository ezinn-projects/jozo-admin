import {
  ICoffeeSessionOrderLineItem,
  ICoffeeSessionOrderSelection,
} from "@/@types/CoffeeSessionOrder";
import {
  FnBMenuCustomizationGroup,
  IFnBCustomizationGroupTemplate,
} from "@/@types/FnBCustomization";
import { FnBMenuItem } from "@/hooks/use-menu-items";

export type SelectionDisplayGroup = {
  key: string;
  label: string;
  options: {
    key: string;
    label: string;
    priceDelta?: number;
  }[];
};

export const normalizeSelectionKey = (value: string) => value.trim().toLowerCase();

export const formatSelectionPrice = (priceDelta?: number) => {
  if (typeof priceDelta !== "number") return "";

  const prefix = priceDelta > 0 ? "+" : "";
  return ` (${prefix}${priceDelta.toLocaleString("vi-VN")} VND)`;
};

export const getMenuItemCustomizationGroups = (
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

export const getSelectionDisplayGroups = (
  customizationGroups: FnBMenuCustomizationGroup[],
  selections?: ICoffeeSessionOrderSelection[] | null,
): SelectionDisplayGroup[] => {
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

export const getLineItemSelectionDisplayGroups = (
  item: Pick<ICoffeeSessionOrderLineItem, "itemId" | "selections">,
  menuItems: FnBMenuItem[],
  templates: IFnBCustomizationGroupTemplate[],
): SelectionDisplayGroup[] => {
  const menuItem = menuItems.find((m) => m._id === item.itemId);
  const hasOwnCustomizations =
    (menuItem?.customizationGroups?.length || 0) > 0 ||
    (menuItem?.customizationTemplateRefs?.length || 0) > 0;
  const selectionSourceItem = hasOwnCustomizations
    ? menuItem
    : menuItems.find((sourceItem) => sourceItem._id === menuItem?.parentId) ||
      menuItem;
  const customizationGroups = getMenuItemCustomizationGroups(
    selectionSourceItem,
    templates,
  );
  return getSelectionDisplayGroups(customizationGroups, item.selections);
};

export const selectionGroupsToPlainLines = (
  groups: SelectionDisplayGroup[],
): string[] =>
  groups.map(
    (g) =>
      `${g.label}: ${g.options
        .map((o) => `${o.label}${formatSelectionPrice(o.priceDelta)}`)
        .join(", ")}`,
  );
