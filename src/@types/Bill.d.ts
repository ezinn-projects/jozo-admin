import type { ITierDiscount } from "./Membership";

/** Membership snapshot BE trả kèm bill sau khi áp discount */
export interface IBillMembership {
  name?: string;
  full_name?: string;
  tier?: string;
  phone?: string;
  phone_number?: string;
  /** Config discount theo hạng */
  tierDiscount?: ITierDiscount[];
  discountPercentage?: number;
  discountAmount?: number;
  note?: string;
  /** Số tiền thực tế đã trừ (nếu BE nhét trong membership) */
  discountAppliedAmount?: number;
}

/** Discount hạng thành viên BE áp trên bill (chi tiết) */
export interface IBillMembershipDiscount {
  tier?: string;
  discountPercentage?: number;
  discountAmount?: number;
  note?: string;
  /** Số tiền thực tế đã trừ */
  appliedAmount?: number;
}

export interface IBill {
  _id: string;
  roomId: string;
  roomName: string;
  scheduleId: string;
  paymentMethod: string;
  customer: {
    name: string;
    phoneNumber: string;
  };
  roomPrice: number;
  fnbOrders: Array<{
    _id: string;
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    totalPrice: number;
  }>;
  fnbTotal: number;
  roomTotal: number;
  totalAmount: number;
  freeHourPromotion?: {
    freeMinutesApplied?: number;
    freeAmount?: number;
  };
  /** Snapshot membership khi BE áp giảm giá theo phone */
  membership?: IBillMembership;
  /** Số tiền membership đã trừ — FE chỉ hiển thị, không tự tính */
  membershipDiscountAmount?: number;
  membershipDiscount?: IBillMembershipDiscount;
  startTime: Date;
  endTime: Date;
  actualEndTime: Date;
  createdAt: Date;
  updatedAt: Date;
  invoiceCode: string;
  completedBy?: string;
  createdBy?: string;
}
