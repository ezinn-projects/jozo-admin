export const FNB_CATEGORIES = {
  SNACKS: "snacks",
  DRINKS: "drinks",
} as const;

export const FNB_CATEGORY_LABELS = {
  [FNB_CATEGORIES.SNACKS]: "Snack",
  [FNB_CATEGORIES.DRINKS]: "Drink",
} as const;
