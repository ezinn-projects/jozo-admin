import http from "@/utils/http";
// import { HTTPResponse } from "@/@types";
const HOLIDAY_API_URL = "/holidays";

/** Body tạo/sửa ngày lễ — salaryMultiplier: 0.1–20 hoặc null (không nhân) */
export interface Holiday {
  _id?: string;
  date: string;
  name: string;
  description?: string;
  salaryMultiplier?: number | null;
}

const holidayApis = {
  getHolidays: async () => {
    const response = await http.get<HTTPResponse<Holiday[]>>(HOLIDAY_API_URL);
    return response.data;
  },

  addHoliday: async (holiday: Holiday) => {
    const response = await http.post<HTTPResponse<Holiday>>(
      HOLIDAY_API_URL,
      holiday
    );
    return response.data;
  },

  updateHoliday: async (holiday: Holiday) => {
    const response = await http.put<HTTPResponse<Holiday>>(
      `${HOLIDAY_API_URL}/${holiday._id}`,
      holiday
    );
    return response.data;
  },

  deleteHoliday: async (id: string) => {
    const response = await http.delete<HTTPResponse<Holiday>>(
      `${HOLIDAY_API_URL}/${id}`
    );
    return response.data;
  },
};

export default holidayApis;
