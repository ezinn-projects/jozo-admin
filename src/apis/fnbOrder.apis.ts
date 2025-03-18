// import { IFnbOrder } from "@/@types/FnbOrder";
import { IFnbOrder } from "@/@types/FnbOrder";
import http from "@/utils/http";

const FNB_ORDER_CONTROLLER = "/fnb-order";

// Interface cho FNB Order (input API)
export interface ICreateFnbOrderRequestBody {
  roomScheduleId: string;
  order: {
    drinks: Record<string, number>;
    snacks: Record<string, number>;
  };
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
};

export default fnbOrderApis;
