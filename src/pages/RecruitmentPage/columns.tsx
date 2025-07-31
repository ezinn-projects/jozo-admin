import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Recruitment,
  RecruitmentStatus,
  CurrentStatus,
} from "@/@types/Recruitment";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Mail, Phone, Calendar, Eye } from "lucide-react";
import { StatusUpdateCell } from "./StatusUpdateCell";

const statusColors = {
  [RecruitmentStatus.Pending]: "bg-yellow-100 text-yellow-800",
  [RecruitmentStatus.Reviewed]: "bg-blue-100 text-blue-800",
  [RecruitmentStatus.Approved]: "bg-green-100 text-green-800",
  [RecruitmentStatus.Rejected]: "bg-red-100 text-red-800",
  [RecruitmentStatus.Hired]: "bg-purple-100 text-purple-800",
};

const statusLabels = {
  [RecruitmentStatus.Pending]: "Chờ xử lý",
  [RecruitmentStatus.Reviewed]: "Đã xem xét",
  [RecruitmentStatus.Approved]: "Đã duyệt",
  [RecruitmentStatus.Rejected]: "Từ chối",
  [RecruitmentStatus.Hired]: "Đã tuyển dụng",
};

const currentStatusLabels = {
  [CurrentStatus.Student]: "Sinh viên",
  [CurrentStatus.Working]: "Đang làm việc",
  [CurrentStatus.Other]: "Khác",
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

const calculateAge = (birthDate: string) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export const columns: ColumnDef<Recruitment>[] = [
  {
    accessorKey: "fullName",
    header: "Ứng viên",
    cell: ({ row }) => {
      const recruitment = row.original;
      return (
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {getInitials(recruitment.fullName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{recruitment.fullName}</div>
            <div className="text-sm text-gray-500">{recruitment.position}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "contact",
    header: "Thông tin liên hệ",
    cell: ({ row }) => {
      const recruitment = row.original;
      return (
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="h-3 w-3 text-gray-400" />
            <span>{recruitment.email}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Phone className="h-3 w-3 text-gray-400" />
            <span>{recruitment.phone}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "personalInfo",
    header: "Thông tin cá nhân",
    cell: ({ row }) => {
      const recruitment = row.original;
      return (
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="h-3 w-3 text-gray-400" />
            <span>{calculateAge(recruitment.birthDate)} tuổi</span>
          </div>
          <div className="text-sm text-gray-500">{recruitment.gender}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "currentStatus",
    header: "Tình trạng hiện tại",
    cell: ({ row }) => {
      const recruitment = row.original;
      return (
        <div className="text-sm">
          {currentStatusLabels[recruitment.currentStatus as CurrentStatus] ||
            recruitment.currentStatus}
          {recruitment.otherStatus && (
            <div className="text-xs text-gray-500 mt-1">
              {recruitment.otherStatus}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "workDays",
    header: "Ngày làm việc",
    cell: ({ row }) => {
      const recruitment = row.original;
      return (
        <div className="flex flex-wrap gap-1">
          {recruitment.workDays.slice(0, 3).map((day, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {day}
            </Badge>
          ))}
          {recruitment.workDays.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{recruitment.workDays.length - 3}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "submittedAt",
    header: "Ngày nộp",
    cell: ({ row }) => {
      const recruitment = row.original;
      return (
        <div className="text-sm">
          {format(new Date(recruitment.submittedAt), "dd/MM/yyyy", {
            locale: vi,
          })}
          <div className="text-xs text-gray-500">
            {format(new Date(recruitment.submittedAt), "HH:mm", { locale: vi })}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const recruitment = row.original;
      return (
        <div className="space-y-2">
          <Badge
            className={statusColors[recruitment.status as RecruitmentStatus]}
          >
            {statusLabels[recruitment.status as RecruitmentStatus]}
          </Badge>
          <StatusUpdateCell
            recruitmentId={recruitment._id}
            currentStatus={recruitment.status}
          />
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => {
      const recruitment = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Chi tiết ứng viên</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Họ tên
                    </label>
                    <p className="text-sm">{recruitment.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Ngày sinh
                    </label>
                    <p className="text-sm">
                      {format(new Date(recruitment.birthDate), "dd/MM/yyyy", {
                        locale: vi,
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Giới tính
                    </label>
                    <p className="text-sm">{recruitment.gender}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Số điện thoại
                    </label>
                    <p className="text-sm">{recruitment.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <p className="text-sm">{recruitment.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Mạng xã hội
                    </label>
                    <p className="text-sm">{recruitment.socialMedia}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Tình trạng hiện tại
                    </label>
                    <p className="text-sm">
                      {currentStatusLabels[
                        recruitment.currentStatus as CurrentStatus
                      ] || recruitment.currentStatus}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Vị trí ứng tuyển
                    </label>
                    <p className="text-sm">{recruitment.position}</p>
                  </div>
                </div>

                {recruitment.otherStatus && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Tình trạng khác
                    </label>
                    <p className="text-sm">{recruitment.otherStatus}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Ngày có thể làm việc
                  </label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {recruitment.workDays.map((day, index) => (
                      <Badge key={index} variant="secondary">
                        {day}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      );
    },
  },
];
