import { IBill } from "@/@types/Bill";
import http from "@/utils/http";
import dayjs from "dayjs";

const billAPis = {
  getBillByScheduleId: async (
    scheduleId: string,
    actualEndTime: string = dayjs().toISOString()
  ) =>
    http.get<HTTPResponse<IBill>>(
      `/bill/${scheduleId}/?actualEndTime=${actualEndTime}`
    ),
  printBill: async (
    scheduleId: string,
    data: { paymentMethod: string; actualEndTime: string }
  ) => http.post<HTTPResponse<IBill>>(`/bill/${scheduleId}`, data),
  // API generate PDF, trả về file PDF ở dạng buffer (arraybuffer)
  generateBill: async (
    scheduleId: string,
    data: { paymentMethod: string; actualEndTime: string }
  ) =>
    http.post(`/bill/${scheduleId}/generate`, data, {
      responseType: "blob",
      headers: {
        "Content-Type": "application/pdf",
      },
    }),
};

export default billAPis;
