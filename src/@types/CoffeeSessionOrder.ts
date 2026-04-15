import { OrderDetailItem } from "./FnbOrder";

export interface ICoffeeSessionOrder {
  drinks: Record<string, number>;
  snacks: Record<string, number>;
  variants?: Record<string, Record<string, number>>;
}

export interface ICoffeeSessionOrderDetail {
  coffeeSessionId: string;
  order: ICoffeeSessionOrder;
  items: {
    drinks: OrderDetailItem[];
    snacks: OrderDetailItem[];
  };
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface IUpdateCoffeeSessionOrderRequestBody {
  order: ICoffeeSessionOrder;
  updatedBy?: string;
}

/** Payload socket `order:new` khi app coffee đặt món thành công */
export interface ICoffeeOrderNewSocketPayload {
  tableId: string;
  tableCode: string;
  coffeeSessionId: string;
  order: {
    _id: string;
    coffeeSessionId: string;
    order: ICoffeeSessionOrder;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
    history?: unknown[];
  };
  createdAt: number;
}
