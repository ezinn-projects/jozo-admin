import http from "@/utils/http";
import { Recruitment, RecruitmentStats } from "@/@types/Recruitment";

export const recruitmentApis = {
  // Lấy danh sách tuyển dụng
  getRecruitments: () => {
    return http.get<{
      data: Recruitment[];
      message: string;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>("/recruitments/recruitments");
  },

  // Lấy chi tiết tuyển dụng
  getRecruitmentById: (id: string) => {
    return http.get<{ data: Recruitment; message: string }>(
      `/recruitments/recruitments/${id}`
    );
  },

  // Lấy thống kê
  getStats: () => {
    return http.get<{ data: RecruitmentStats; message: string }>(
      "/recruitments/stats"
    );
  },

  // Cập nhật trạng thái
  updateStatus: (id: string, status: string) => {
    return http.put(`/recruitments/recruitments/${id}/status`, { status });
  },
};
