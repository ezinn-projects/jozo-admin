import http from "@/utils/http";
import { EmployeeScheduleStatus } from "@/constants/enum";

export interface IRegisterStaffScheduleRequest {
  userId: string;
  date: string; // Format: YYYY-MM-DD
  shifts: string[]; // ["shift1", "shift2", "shift3"]
  note?: string;
  customStartTime?: string; // Format: HH:mm
  customEndTime?: string; // Format: HH:mm
}

export interface IEmployeeSelfRegisterRequest {
  date: string; // Format: YYYY-MM-DD
  shifts: string[]; // ["shift1", "shift2", "shift3"]
  note?: string;
  customStartTime?: string; // Format: HH:mm
  customEndTime?: string; // Format: HH:mm
}

export interface IShiftInfo {
  name: string;
  startTime: string;
  endTime: string;
}

export interface IEmployeeScheduleSalarySnapshot {
  hourlyRate: number;
  snapshotAt?: string;
  capturedAt?: string;
  syncedFromSnapshot?: number;
  source?: "global" | "override" | "manual";
}

export interface IEmployeeScheduleSalary {
  hourlyRate: number;
  hours: number;
  totalAmount: number;
  isPayable: boolean;
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
  shift?: "shift1" | "shift2" | "shift3" | "morning" | "afternoon" | "evening" | "all";
  shiftType?: "shift1" | "shift2" | "shift3" | "morning" | "afternoon" | "evening" | "all";
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
  salarySnapshot?: IEmployeeScheduleSalarySnapshot;
  salary?: IEmployeeScheduleSalary;
  createdAt?: string;
  updatedAt?: string;
}

export interface IEmployeeSalarySnapshot {
  hourlyRate: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IEmployeeSalaryConfig {
  userId: string;
  userName?: string;
  userPhone?: string;
  hourlyRate: number;
  snapshotHourlyRate: number;
  isOverride: boolean;
  updatedAt?: string;
}

export interface IUpdateEmployeeSalarySnapshotRequest {
  hourlyRate: number;
}

export interface IUpdateEmployeeSalaryOverrideRequest {
  hourlyRate: number;
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
  getScheduleById: (id: string) =>
    http.get<HTTPResponse<IEmployeeSchedule>>(`/employee-schedules/${id}`),
  updateSchedule: (
    id: string,
    data: {
      date?: string; // Format: YYYY-MM-DD
      shiftType?: "shift1" | "shift2" | "shift3" | "morning" | "afternoon" | "evening" | "all";
      customStartTime?: string; // Format: HH:mm
      customEndTime?: string; // Format: HH:mm
      note?: string;
      status?: EmployeeScheduleStatus;
      specialHourlyRate?: number;
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
  getSalarySnapshot: () =>
    http.get<HTTPResponse<IEmployeeSalarySnapshot>>(
      "/employee-schedules/salary/snapshot"
    ),
  updateSalarySnapshot: (data: IUpdateEmployeeSalarySnapshotRequest) =>
    http.put<HTTPResponse<IEmployeeSalarySnapshot>>(
      "/employee-schedules/salary/snapshot",
      data
    ),
  syncSalarySnapshot: () =>
    http.post<HTTPResponse>("/employee-schedules/salary/sync"),
  getSalaryEmployees: () =>
    http.get<HTTPResponse<IEmployeeSalaryConfig[]>>(
      "/employee-schedules/salary/employees"
    ),
  updateEmployeeSalaryOverride: (
    userId: string,
    data: IUpdateEmployeeSalaryOverrideRequest
  ) =>
    http.put<HTTPResponse<IEmployeeSalaryConfig>>(
      `/employee-schedules/salary/employees/${userId}`,
      data
    ),
  deleteEmployeeSalaryOverride: (userId: string) =>
    http.delete<HTTPResponse<IEmployeeSalaryConfig>>(
      `/employee-schedules/salary/employees/${userId}/override`
    ),
};

export default staffScheduleApis;

