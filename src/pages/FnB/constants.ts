export const FNB_CATEGORIES = {
  SNACKS: "snacks",
  DRINKS: "drinks",
} as const;

export const FNB_CATEGORY_LABELS = {
  [FNB_CATEGORIES.SNACKS]: "Food",
  [FNB_CATEGORIES.DRINKS]: "Beverage",
} as const;
