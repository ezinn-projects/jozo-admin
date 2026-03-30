import { GiftType } from "@/@types/Gift";

export const GIFT_TYPES = {
  SNACKS_DRINKS: "snacks_drinks" as GiftType,
  DISCOUNT_PERCENTAGE: "discount_percentage" as GiftType,
  DISCOUNT_AMOUNT: "discount_amount" as GiftType,
  FNB_DISCOUNT_AMOUNT: "fnb_discount_amount" as GiftType,
  // Alias cũ cho backward compatibility (map về giảm giá %)
  DISCOUNT: "discount" as GiftType,
} as const;

export const GIFT_TYPE_LABELS: Record<GiftType, string> = {
  snacks_drinks: "Đồ ăn & Đồ uống",
  discount_percentage: "Giảm giá (%)",
  discount_amount: "Giảm giá (VND)",
  fnb_discount_amount: "Giảm giá FnB (VND)",
  discount: "Giảm giá (%)",
};

