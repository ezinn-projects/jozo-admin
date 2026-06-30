import { OrderDetail, OrderDetailItem } from "@/@types/FnbOrder";

/** Gộp các order line có cùng itemId (cộng quantity). */
export function mergeOrderDetailItems(
  items: OrderDetailItem[],
): OrderDetailItem[] {
  const byItemId = new Map<string, OrderDetailItem>();

  for (const item of items) {
    const existing = byItemId.get(item.itemId);
    if (existing) {
      byItemId.set(item.itemId, {
        ...existing,
        quantity: existing.quantity + item.quantity,
      });
    } else {
      byItemId.set(item.itemId, { ...item });
    }
  }

  return Array.from(byItemId.values());
}

/** Chuẩn hóa order detail từ API: gộp drinks/snacks theo itemId. */
export function normalizeOrderDetail(orderDetail: OrderDetail): OrderDetail {
  return {
    ...orderDetail,
    items: {
      drinks: mergeOrderDetailItems(orderDetail.items?.drinks || []),
      snacks: mergeOrderDetailItems(orderDetail.items?.snacks || []),
    },
  };
}

export interface MergeableBillItem {
  description: string;
  price: number;
  quantity: number;
  itemId?: string;
  category?: string;
  originalPrice?: number;
  discountName?: string;
  discountPercentage?: number;
  promotionId?: string;
}

/** Gộp các dòng bill trùng itemId (hoặc description nếu chưa có itemId). */
export function mergeBillItemsByItemId<T extends MergeableBillItem>(
  items: T[],
): T[] {
  const byKey = new Map<string, T>();

  for (const item of items) {
    const key = item.itemId || item.description;
    const existing = byKey.get(key);
    if (existing) {
      byKey.set(key, {
        ...existing,
        quantity: existing.quantity + item.quantity,
      });
    } else {
      byKey.set(key, { ...item });
    }
  }

  return Array.from(byKey.values());
}

/** Lấy tổng quantity của item từ order detail (ưu tiên order.drinks/snacks đã gộp). */
export function getOrderItemQuantity(
  orderDetail: OrderDetail | undefined,
  itemId: string,
): number {
  if (!orderDetail) return 0;

  const fromOrder =
    orderDetail.order?.drinks?.[itemId] ??
    orderDetail.order?.snacks?.[itemId];
  if (fromOrder !== undefined) return fromOrder;

  const merged = mergeOrderDetailItems([
    ...(orderDetail.items?.drinks || []),
    ...(orderDetail.items?.snacks || []),
  ]);
  return merged.find((item) => item.itemId === itemId)?.quantity ?? 0;
}
