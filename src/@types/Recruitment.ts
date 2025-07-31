export interface Recruitment {
  _id: string;
  fullName: string;
  birthDate: string; // API trả về string thay vì Date
  gender: string;
  phone: string;
  email: string | null;
  socialMedia: string;
  currentStatus: string;
  otherStatus: string | null;
  position: string[]; // Thay đổi từ string thành string[]
  workShifts: string[]; // Mới thêm
  submittedAt: string; // API trả về string thay vì Date
  status: string;
  workDays?: string[] | null; // Optional - backward compatibility
}

export interface RecruitmentStats {
  total: number;
  pending: number;
  reviewed: number;
  contacted: number; // Mới thêm
  hired: number;
  rejected: number;
  // Thêm stats theo position, gender, age
  byPosition?: Record<string, number>;
  byGender?: Record<string, number>;
  byAge?: Record<string, number>;
}

export interface RecruitmentResponse {
  message: string;
  data: Recruitment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RecruitmentDetailResponse {
  message: string;
  data: Recruitment;
}

export interface RecruitmentStatsResponse {
  message: string;
  data: RecruitmentStats;
}

export enum RecruitmentStatus {
  Pending = "pending",
  Reviewed = "reviewed",
  Contacted = "contacted", // Mới thêm
  Hired = "hired",
  Rejected = "rejected",
}

export enum CurrentStatus {
  Student = "student",
  Working = "working",
  Other = "other",
}

export enum Gender {
  Male = "male",
  Female = "female",
  Other = "other",
}

export enum Position {
  Cashier = "cashier",
  Server = "server",
  Parking = "parking",
  Kitchen = "kitchen",
  Bartender = "bartender",
  Manager = "manager",
  Other = "other",
}

export enum WorkShift {
  Morning = "morning",
  Evening = "evening",
  Night = "night",
  FullTime = "fulltime",
}

export enum WorkDay {
  Monday = "monday",
  Tuesday = "tuesday",
  Wednesday = "wednesday",
  Thursday = "thursday",
  Friday = "friday",
  Saturday = "saturday",
  Sunday = "sunday",
}
