import { IBill } from "@/@types/Bill";
import http from "@/utils/http";
import dayjs from "dayjs";

const billAPis = {
  getBillByScheduleId: async (
    scheduleId: string,
    promotionId?: string,
    actualEndTime: string = dayjs().toISOString(),
    actualStartTime?: string
  ) => {
    const params = new URLSearchParams();

    // Thêm các tham số bắt buộc
    params.append("actualEndTime", actualEndTime);

    // Thêm các tham số tùy chọn nếu có
    if (promotionId) {
      params.append("promotionId", promotionId);
    }

    if (actualStartTime) {
      params.append("actualStartTime", actualStartTime);
    }

    return http.get<HTTPResponse<IBill>>(
      `/bill/${scheduleId}/?${params.toString()}`
    );
  },

  getBillById: async (billId: string) => {
    return http.get<
      HTTPResponse<
        IBill & {
          roomName: string;
          roomType: string;
          customerName: string;
          formattedStartTime: string;
          formattedEndTime: string;
          formattedCreatedAt: string;
          usageDuration: string;
          items?: {
            description: string;
            price: number;
            quantity: number;
            discountName?: string;
            discountPercentage?: number;
            promotionId?: string;
          }[];
        }
      >
    >(`/bill/details/${billId}`);
  },

  printBill: async (
    scheduleId: string,
    data: {
      paymentMethod: string;
      actualEndTime: string;
      promotionId?: string;
      actualStartTime?: string;
    }
  ) => http.post<HTTPResponse<IBill>>(`/bill/${scheduleId}`, data),
  // API generate PDF, trả về file PDF ở dạng buffer (arraybuffer)
  generateBill: async (
    scheduleId: string,
    data: { paymentMethod: string; actualEndTime: string; promotionId?: string }
  ) =>
    http.post(`/bill/${scheduleId}/generate`, data, {
      responseType: "blob",
      headers: {
        "Content-Type": "application/pdf",
      },
    }),
  // Revenue APIs
  getDailyRevenue: async (date: string) =>
    http.get<
      HTTPResponse<{
        date: string;
        formattedDate: string;
        totalRevenue: number;
        billCount: number;
        bills: IBill[];
      }>
    >(`/bill/revenue/daily?date=${date}`),

  getWeeklyRevenue: async (date: string) =>
    http.get<
      HTTPResponse<{
        week: number;
        year: number;
        dateRange: string;
        startDate: Date;
        endDate: Date;
        totalRevenue: number;
        billCount: number;
        bills: IBill[];
      }>
    >(`/bill/revenue/weekly?date=${date}`),

  getMonthlyRevenue: async (date: string) =>
    http.get<
      HTTPResponse<{
        month: string;
        year: number;
        dateRange: string;
        startDate: Date;
        endDate: Date;
        totalRevenue: number;
        billCount: number;
        bills: IBill[];
      }>
    >(`/bill/revenue/monthly?date=${date}`),
};

export default billAPis;
