interface FNBOrder {
  drinks: Record<string, number>;
  snacks: Record<string, number>;
  variants?: Record<string, Record<string, number>>; // menuId -> variantName -> quantity
}

interface IFnbOrder {
  _id?: string;
  roomScheduleId: string; // Khóa ngoại tham chiếu đến RoomSchedule._id
  order: FNBOrder;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

// Thông tin chi tiết từng item trong order
export interface OrderDetailItem {
  lineId?: string;
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

// Thông tin chi tiết order trả về từ API /fnb-orders/detail/:roomScheduleId
export interface OrderDetail {
  roomScheduleId: string;
  order: {
    drinks: Record<string, number>;
    snacks: Record<string, number>;
  };
  items: {
    drinks: OrderDetailItem[];
    snacks: OrderDetailItem[];
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export type { IFnbOrder, FNBOrder };
