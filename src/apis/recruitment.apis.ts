import http from "@/utils/http";
import { Recruitment, RecruitmentStats } from "@/@types/Recruitment";

export const recruitmentApis = {
  // Lấy danh sách tuyển dụng
  getRecruitments: (
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string,
    position?: string,
    workShifts?: string,
    gender?: string
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) {
      params.append("search", search);
    }
    if (status) {
      params.append("status", status);
    }
    if (position) {
      params.append("position", position);
    }
    if (workShifts) {
      params.append("workShifts", workShifts);
    }
    if (gender) {
      params.append("gender", gender);
    }

    return http.get<{
      data: Recruitment[];
      message: string;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/recruitments/recruitments?${params.toString()}`);
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
