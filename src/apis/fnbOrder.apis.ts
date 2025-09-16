// import { IFnbOrder } from "@/@types/FnbOrder";
import { IFnbOrder } from "@/@types/FnbOrder";
import http from "@/utils/http";
import type { OrderDetail } from "@/@types/FnbOrder";

// Interface cho result của complete order
export interface ICompleteOrderResult {
  order: IFnbOrder;
  updatedItems: Array<{
    _id: string;
    name: string;
    category: string;
    price: number;
    inventory: {
      quantity: number;
      minStock?: number;
      maxStock?: number;
      lastUpdated: string;
    };
  }>;
}

const FNB_ORDER_CONTROLLER = "/fnb-orders";

// Interface cho FNB Order (input API)
export interface ICreateFnbOrderRequestBody {
  roomScheduleId: string;
  order: {
    drinks: Record<string, number>;
    snacks: Record<string, number>;
  };
  createdBy: string;
}

// Interface cho Add/Remove Item
export interface IAddRemoveItemRequestBody {
  itemId: string;
  quantity: number;
  category: "drinks" | "snacks";
  createdBy: string;
}

// Interface cho Complete Order
export interface ICompleteOrderRequestBody {
  roomScheduleId: string;
  items: Array<{
    itemId: string;
    quantity: number;
  }>;
  createdBy: string;
}

const fnbOrderApis = {
  // Tạo mới FNB Order
  createFnbOrder: (payload: ICreateFnbOrderRequestBody) => {
    return http.post<HTTPResponse<IFnbOrder>>(
      `${FNB_ORDER_CONTROLLER}`,
      payload
    );
  },
  // Lấy FNB Order theo id
  getFnbOrderById: (id: string) => {
    return http.get<HTTPResponse<IFnbOrder>>(`${FNB_ORDER_CONTROLLER}/${id}`);
  },
  // Cập nhật FNB Order
  updateFnbOrder: (payload: ICreateFnbOrderRequestBody & { _id: string }) => {
    return http.put<HTTPResponse<IFnbOrder>>(
      `${FNB_ORDER_CONTROLLER}/${payload._id}`,
      payload
    );
  },
  // Xóa FNB Order
  deleteFnbOrder: (payload: { _id: string }) => {
    return http.delete<HTTPResponse<IFnbOrder>>(
      `${FNB_ORDER_CONTROLLER}/${payload._id}`
    );
  },
  // Lấy danh sách FNB Orders theo Room Schedule ID
  getFnbOrdersByRoomSchedule: (roomScheduleId: string) => {
    return http.get<HTTPResponse<IFnbOrder[]>>(
      `${FNB_ORDER_CONTROLLER}/fnb-order/${roomScheduleId}`
    );
  },
  // Thêm item vào order
  addItemToOrder: (
    roomScheduleId: string,
    payload: IAddRemoveItemRequestBody
  ) => {
    return http.post<HTTPResponse<IFnbOrder>>(
      `${FNB_ORDER_CONTROLLER}/${roomScheduleId}/add-item`,
      payload
    );
  },
  // Xóa item khỏi order
  removeItemFromOrder: (
    roomScheduleId: string,
    payload: IAddRemoveItemRequestBody
  ) => {
    return http.post<HTTPResponse<IFnbOrder>>(
      `${FNB_ORDER_CONTROLLER}/${roomScheduleId}/remove-item`,
      payload
    );
  },
  // Complete order với items
  completeOrder: (payload: ICompleteOrderRequestBody) => {
    return http.post<HTTPResponse<ICompleteOrderResult>>(
      `${FNB_ORDER_CONTROLLER}/complete`,
      payload
    );
  },
  // Upsert item vào order (thêm hoặc cập nhật số lượng)
  upsertItem: (payload: {
    roomScheduleId: string;
    itemId: string;
    quantity: number;
    category: string;
    createdBy: string;
  }) => {
    return http.post<HTTPResponse<IFnbOrder>>(
      `${FNB_ORDER_CONTROLLER}/upsert-item`,
      payload
    );
  },
  // Lấy chi tiết order theo roomScheduleId (API mới)
  getFnbOrderDetail: (roomScheduleId: string) => {
    return http.get<HTTPResponse<OrderDetail>>(
      `${FNB_ORDER_CONTROLLER}/detail/${roomScheduleId}`
    );
  },
  // Mark order as served
  markOrderAsServed: (roomId: string, orderId: string) => {
    return http.post<HTTPResponse<{ success: boolean; message: string }>>(
      `/rooms/${roomId}/orders/${orderId}/serve`
    );
  },
};

export default fnbOrderApis;
