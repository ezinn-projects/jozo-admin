export interface Recruitment {
  _id: string;
  fullName: string;
  birthDate: string; // API trả về string thay vì Date
  gender: string;
  phone: string;
  email: string;
  socialMedia: string;
  currentStatus: string;
  otherStatus: string;
  workDays: string[];
  position: string;
  submittedAt: string; // API trả về string thay vì Date
  status: string;
}

export interface RecruitmentStats {
  total: number;
  pending: number;
  reviewed: number;
  approved: number;
  rejected: number;
  hired: number;
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
  Approved = "approved",
  Rejected = "rejected",
  Hired = "hired",
}

export enum CurrentStatus {
  Student = "student",
  Working = "working",
  Other = "other",
}

export enum Gender {
  Male = "male",
  Female = "female",
}

export enum Position {
  Server = "server",
  Bartender = "bartender",
  Kitchen = "kitchen",
  Manager = "manager",
  Other = "other",
}
