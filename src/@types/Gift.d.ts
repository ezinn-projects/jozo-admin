import { FnBCategory } from "@/constants/enum";

export type GiftType = "snacks_drinks" | "discount";

export interface GiftBundleItem {
  itemId: string; // ObjectId từ backend được serialize thành string
  quantity: number;
  name: string;
  category?: FnBCategory;
  priceSnapshot?: number;
  source: "fnb_menu" | "fnb_menu_item";
}

export interface Gift {
  _id?: string; // ObjectId từ backend được serialize thành string
  name: string;
  type: GiftType;
  image?: string;
  price?: number;
  discountPercentage?: number;
  items?: GiftBundleItem[];
  totalQuantity: number; // tổng số suất quà (bundle) tạo ra
  remainingQuantity: number; // số suất còn lại để random
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface GiftCreateRequest {
  name: string;
  type: GiftType;
  image?: string;
  price?: number;
  discountPercentage?: number;
  items?: GiftBundleItem[];
  totalQuantity: number;
  isActive?: boolean;
}

export type ScheduleGiftStatus = "assigned" | "claimed" | "removed";

export interface ScheduleGift {
  giftId: string; // ObjectId từ backend được serialize thành string
  name: string;
  type: GiftType;
  status: ScheduleGiftStatus;
  assignedAt: Date;
  claimedAt?: Date;
  discountPercentage?: number;
  items?: GiftBundleItem[];
}

