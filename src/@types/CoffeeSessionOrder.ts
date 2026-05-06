import { OrderDetailItem } from "./FnbOrder";

export interface ICoffeeSessionOrder {
  drinks: Record<string, number>;
  snacks: Record<string, number>;
  variants?: Record<string, Record<string, number>>;
  lines?: ICoffeeSessionOrderLine[];
}

export interface ICoffeeSessionOrderSelection {
  groupKey: string;
  optionKey: string;
}

export interface ICoffeeSessionOrderLine {
  lineId: string;
  itemId: string;
  category: string;
  quantity: number;
  note?: string | null;
  selections?: ICoffeeSessionOrderSelection[] | null;
}

export interface ICoffeeSessionOrderLineItem extends OrderDetailItem {
  lineId: string;
  note?: string | null;
  selections?: ICoffeeSessionOrderSelection[] | null;
}

/** Tổng tiền F&B (đồng bộ backend) */
export interface ICoffeeOrderTotals {
  pricingMode: "menu_listed" | "board_game_ticket";
  fnbListTotal: number;
  fnbChargedTotal: number;
}

export type CoffeeOrderBatchStatus = "pending" | "served";

/** Một đợt gửi order (batch) */
export interface ICompactCoffeeSessionOrderBatch {
  batchId: string;
  status: CoffeeOrderBatchStatus;
  submittedAt: string;
  servedAt?: string;
  servedBy?: string;
  order: { lines: ICoffeeSessionOrderLine[] };
  lineItems: ICoffeeSessionOrderLineItem[];
  orderTotals?: ICoffeeOrderTotals;
}

/**
 * Đơn tổng (aggregated) — có danh sách batch.
 * `lineItems` là snapshot tổng hợp; chi tiết theo đợt nằm trong `batches`.
 */
export interface ICompactCoffeeSessionOrder {
  _id?: string;
  coffeeSessionId: string;
  order: {
    lines: ICoffeeSessionOrderLine[];
  };
  lineItems: ICoffeeSessionOrderLineItem[];
  batches?: ICompactCoffeeSessionOrderBatch[];
  orderTotals?: ICoffeeOrderTotals;
  updatedAt: string;
}

/** Alias legacy / tài liệu */
export type CompactCoffeeSessionOrder = ICompactCoffeeSessionOrder;

export interface ICoffeeSessionOrderDetail {
  coffeeSessionId: string;
  order: ICoffeeSessionOrder;
  items: {
    drinks: OrderDetailItem[];
    snacks: OrderDetailItem[];
  };
  lineItems?: ICoffeeSessionOrderLineItem[];
  batches?: ICompactCoffeeSessionOrderBatch[];
  orderTotals?: ICoffeeOrderTotals;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface IUpdateCoffeeSessionOrderRequestBody {
  order: ICoffeeSessionOrder;
  updatedBy?: string;
}

/** POST /client/coffee-session-orders/me/submit-cart — `result` */
export interface ISubmitCartCoffeeSessionOrderResult {
  aggregatedOrder: ICompactCoffeeSessionOrder | null;
  createdBatch: ICompactCoffeeSessionOrderBatch;
}

/** PATCH .../batches/:batchId/served — `result` */
export interface IMarkCoffeeSessionOrderBatchServedResult {
  batch: ICompactCoffeeSessionOrderBatch;
  aggregatedOrder: ICompactCoffeeSessionOrder | null;
}

/** Payload socket `order:new` / `order:created` (contract mới) */
export interface IOrderCreatedSocketPayload {
  tableId: string;
  tableCode: string;
  coffeeSessionId: string;
  aggregatedOrder: ICompactCoffeeSessionOrder | null;
  createdBatch: ICompactCoffeeSessionOrderBatch;
  submittedLineItems?: ICoffeeSessionOrderLineItem[];
  createdAt: number;
}

/** Payload legacy `order:new` (nested `order` document) */
export interface ICoffeeOrderLegacySocketPayload {
  tableId: string;
  tableCode: string;
  coffeeSessionId: string;
  order: {
    _id: string;
    coffeeSessionId: string;
    order: ICoffeeSessionOrder;
    lineItems?: ICoffeeSessionOrderLineItem[];
    orderTotals?: ICoffeeOrderTotals;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
    history?: unknown[];
  };
  createdAt: number;
}

export type ICoffeeOrderSocketPayload =
  | IOrderCreatedSocketPayload
  | ICoffeeOrderLegacySocketPayload;

/** Payload socket `order:batch_status_changed` */
export interface IOrderBatchStatusChangedSocketPayload {
  tableId: string;
  tableCode: string;
  coffeeSessionId: string;
  batchId: string;
  status: CoffeeOrderBatchStatus;
  servedAt?: string;
  servedBy?: string;
  updatedAt: number;
}

/**
 * @deprecated Dùng `ICoffeeOrderSocketPayload` (hỗ trợ cả batch mới và legacy).
 */
export type ICoffeeOrderNewSocketPayload = ICoffeeOrderSocketPayload;
