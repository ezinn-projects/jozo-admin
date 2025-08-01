import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RecruitmentStatus } from "@/@types/Recruitment";

const statusLabels = {
  [RecruitmentStatus.Pending]: "Chờ xử lý",
  [RecruitmentStatus.Reviewed]: "Đã xem xét",
  [RecruitmentStatus.Contacted]: "Đã liên hệ",
  [RecruitmentStatus.Hired]: "Đã tuyển dụng",
  [RecruitmentStatus.Rejected]: "Từ chối",
};

interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const StatusFilter: React.FC<StatusFilterProps> = ({ value, onChange }) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Lọc theo trạng thái" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Tất cả</SelectItem>
        {Object.entries(statusLabels).map(([statusValue, label]) => (
          <SelectItem key={statusValue} value={statusValue}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default StatusFilter;
