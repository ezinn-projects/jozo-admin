import { GiftType } from "@/@types/Gift";

export const GIFT_TYPES = {
  SNACKS_DRINKS: "snacks_drinks" as GiftType,
  DISCOUNT: "discount" as GiftType,
} as const;

export const GIFT_TYPE_LABELS: Record<GiftType, string> = {
  snacks_drinks: "Đồ ăn & Đồ uống",
  discount: "Giảm giá",
};

