import { IBill } from "@/@types/Bill";
import http from "@/utils/http";
import dayjs from "@/lib/dayjs";

const billAPis = {
  getBillByScheduleId: async (
    scheduleId: string,
    promotionId?: string,
    actualEndTime?: string,
    actualStartTime?: string
  ) => {
    const params = new URLSearchParams();

    // Thêm các tham số bắt buộc - sử dụng thời gian hiện tại nếu không có actualEndTime
    const endTime = actualEndTime || dayjs().toISOString();
    params.append("actualEndTime", endTime);

    // Thêm các tham số tùy chọn nếu có
    if (promotionId) {
      params.append("promotionId", promotionId);
    }

    if (actualStartTime) {
      params.append("actualStartTime", actualStartTime);
    }

    return http.get<HTTPResponse<IBill>>(
      `/bill/${scheduleId}?${params.toString()}`
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
            originalPrice?: number;
            discountName?: string;
            discountPercentage?: number;
            promotionId?: string;
          }[];
          freeHourPromotion?: {
            freeMinutesApplied?: number;
            freeAmount?: number;
          };
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

  // Print bill via WiFi printer
  printBillWifi: async (
    scheduleId: string,
    data: {
      paymentMethod: string;
      actualEndTime: string;
      promotionId?: string;
      actualStartTime?: string;
    }
  ) => http.post<HTTPResponse<IBill>>(`/bill/${scheduleId}/wifi`, data),

  // Save bill to bills collection
  saveBill: async (bill: {
    scheduleId: string;
    roomId: string;
    items: Array<{
      description: string;
      price: number;
      quantity: number;
      originalPrice?: number;
      discountName?: string;
      discountPercentage?: number;
      promotionId?: string;
    }>;
    totalAmount: number;
    customerPhone?: string;
    paymentMethod: string;
    startTime: string;
    endTime: string;
    note?: string;
    promotionId?: string;
    _id?: string;
    createdAt?: string | Date;
    invoiceCode?: string;
  }) => http.post<HTTPResponse<IBill>>("/bill/save", bill),

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
