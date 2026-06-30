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

export const getLineItemCustomizationSourceItem = (
  item: Pick<ICoffeeSessionOrderLineItem, "itemId">,
  menuItems: FnBMenuItem[],
): FnBMenuItem | undefined => {
  const menuItem = menuItems.find((m) => m._id === item.itemId);
  const hasOwnCustomizations =
    (menuItem?.customizationGroups?.length || 0) > 0 ||
    (menuItem?.customizationTemplateRefs?.length || 0) > 0;
  return hasOwnCustomizations
    ? menuItem
    : menuItems.find((sourceItem) => sourceItem._id === menuItem?.parentId) ||
        menuItem;
};

export const getLineItemCustomizationGroups = (
  item: Pick<ICoffeeSessionOrderLineItem, "itemId">,
  menuItems: FnBMenuItem[],
  templates: IFnBCustomizationGroupTemplate[],
): FnBMenuCustomizationGroup[] =>
  getMenuItemCustomizationGroups(
    getLineItemCustomizationSourceItem(item, menuItems),
    templates,
  );

export const getLineItemSelectionDisplayGroups = (
  item: Pick<ICoffeeSessionOrderLineItem, "itemId" | "selections">,
  menuItems: FnBMenuItem[],
  templates: IFnBCustomizationGroupTemplate[],
): SelectionDisplayGroup[] => {
  const customizationGroups = getLineItemCustomizationGroups(
    item,
    menuItems,
    templates,
  );
  return getSelectionDisplayGroups(customizationGroups, item.selections);
};

export type LineItemSelectionState = Record<string, string[]>;

export const selectionsToState = (
  selections?: ICoffeeSessionOrderSelection[] | null,
): LineItemSelectionState => {
  if (!selections?.length) return {};

  return selections.reduce<LineItemSelectionState>((acc, selection) => {
    const groupKey = normalizeSelectionKey(selection.groupKey);
    const optionKey = normalizeSelectionKey(selection.optionKey);
    if (!groupKey || !optionKey) return acc;

    const current = acc[groupKey] || [];
    if (!current.includes(optionKey)) {
      acc[groupKey] = [...current, optionKey];
    }
    return acc;
  }, {});
};

export const stateToSelections = (
  state: LineItemSelectionState,
  customizationGroups: FnBMenuCustomizationGroup[],
): ICoffeeSessionOrderSelection[] => {
  const selections: ICoffeeSessionOrderSelection[] = [];

  customizationGroups.forEach((group) => {
    const groupKey = normalizeSelectionKey(group.groupKey);
    const optionKeys = state[groupKey] || [];

    optionKeys.forEach((optionKey) => {
      const matchedOption = group.options.find(
        (option) => normalizeSelectionKey(option.optionKey) === optionKey,
      );
      if (!matchedOption) return;

      selections.push({
        groupKey: group.groupKey,
        optionKey: matchedOption.optionKey,
      });
    });
  });

  return selections;
};

export const validateSelectionState = (
  state: LineItemSelectionState,
  customizationGroups: FnBMenuCustomizationGroup[],
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  customizationGroups.forEach((group) => {
    const groupKey = normalizeSelectionKey(group.groupKey);
    const count = (state[groupKey] || []).length;

    if (count < group.minSelect) {
      errors.push(
        `${group.label}: cần chọn tối thiểu ${group.minSelect} (đang ${count})`,
      );
    }
    if (count > group.maxSelect) {
      errors.push(
        `${group.label}: chỉ được chọn tối đa ${group.maxSelect} (đang ${count})`,
      );
    }
  });

  return { valid: errors.length === 0, errors };
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
