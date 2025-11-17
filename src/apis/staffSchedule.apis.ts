import http from "@/utils/http";
import { EmployeeScheduleStatus } from "@/constants/enum";

export interface IRegisterStaffScheduleRequest {
  userId: string;
  date: string; // Format: YYYY-MM-DD
  shifts: string[]; // ["morning", "evening"]
  note?: string;
  customStartTime?: string; // Format: HH:mm
  customEndTime?: string; // Format: HH:mm
}

export interface IEmployeeSelfRegisterRequest {
  date: string; // Format: YYYY-MM-DD
  shifts: string[]; // ["morning", "afternoon"]
  note?: string;
  customStartTime?: string; // Format: HH:mm
  customEndTime?: string; // Format: HH:mm
}

export interface IShiftInfo {
  name: string;
  startTime: string;
  endTime: string;
}

export interface IEmployeeSchedule {
  _id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  user?: {
    _id: string;
    name?: string;
    full_name?: string;
    email?: string;
    phone_number?: string;
  };
  date: string; // Format: YYYY-MM-DD hoặc ISO string
  shift?: "morning" | "afternoon" | "evening"; // Legacy field (supports afternoon for backward compatibility)
  shiftType?: "morning" | "afternoon" | "evening"; // New field
  customStartTime?: string; // Format: HH:mm
  customEndTime?: string; // Format: HH:mm
  shiftInfo?: IShiftInfo;
  status: EmployeeScheduleStatus;
  note?: string;
  createdBy?: string;
  createdByName?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  rejectedReason?: string;
  startedAt?: string;
  completedAt?: string;
  markedAbsentBy?: string;
  markedAbsentAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IEmployeeSchedulesSummary {
  totalDays: number;
  totalShifts: number;
  completed: number;
  inProgress: number;
  upcoming: number;
  byStatus: {
    pending: number;
    approved: number;
    "in-progress": number;
    completed: number;
    absent: number;
    rejected: number;
    cancelled: number;
  };
}

export interface IEmployeeSchedulesResponse {
  schedulesByDate: Record<string, IEmployeeSchedule[]>; // Key là date string (YYYY-MM-DD)
  summary: IEmployeeSchedulesSummary;
}

export interface IGetEmployeeSchedulesParams {
  startDate?: string; // Format: YYYY-MM-DD (optional khi dùng filterType)
  endDate?: string; // Format: YYYY-MM-DD (optional khi dùng filterType)
  userId?: string; // Optional: filter by user
  filterType?: "day" | "week" | "month"; // Optional: filter type
  date?: string; // Format: YYYY-MM-DD (dùng với filterType=day)
  status?: EmployeeScheduleStatus | string; // Optional: filter by status
}

const staffScheduleApis = {
  registerStaffSchedule: (data: IRegisterStaffScheduleRequest) =>
    http.post<HTTPResponse>("/employee-schedules/admin", data),
  registerMySchedule: (data: IEmployeeSelfRegisterRequest) =>
    http.post<HTTPResponse>("/employee-schedules", data),
  getEmployeeSchedules: (params?: IGetEmployeeSchedulesParams) =>
    http.get<HTTPResponse<IEmployeeSchedulesResponse>>("/employee-schedules", {
      params,
    }),
  getMySchedules: (params?: IGetEmployeeSchedulesParams) =>
    http.get<HTTPResponse<IEmployeeSchedulesResponse>>("/employee-schedules/me", {
      params,
    }),
  updateSchedule: (
    id: string,
    data: {
      date?: string; // Format: YYYY-MM-DD
      shiftType?: "morning" | "afternoon" | "evening";
      customStartTime?: string; // Format: HH:mm
      customEndTime?: string; // Format: HH:mm
      note?: string;
      status?: EmployeeScheduleStatus;
    }
  ) => http.put<HTTPResponse>(`/employee-schedules/${id}`, data),
  updateScheduleStatus: (
    id: string,
    data: {
      status: EmployeeScheduleStatus;
      rejectedReason?: string; // Chỉ cần khi status = rejected
    }
  ) => http.put<HTTPResponse>(`/employee-schedules/${id}/status`, data),
  deleteSchedule: (id: string) =>
    http.delete<HTTPResponse>(`/employee-schedules/${id}`),
};

export default staffScheduleApis;

