import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RecruitmentStatus } from "@/@types/Recruitment";
import { useUpdateRecruitmentStatus } from "@/hooks/use-recruitment";

const statusLabels = {
  [RecruitmentStatus.Pending]: "Chờ xử lý",
  [RecruitmentStatus.Reviewed]: "Đã xem xét",
  [RecruitmentStatus.Contacted]: "Đã liên hệ",
  [RecruitmentStatus.Hired]: "Đã tuyển dụng",
  [RecruitmentStatus.Rejected]: "Từ chối",
};

interface StatusUpdateCellProps {
  recruitmentId: string;
  currentStatus: string;
}

export const StatusUpdateCell: React.FC<StatusUpdateCellProps> = ({
  recruitmentId,
  currentStatus,
}) => {
  const updateStatusMutation = useUpdateRecruitmentStatus();

  const handleStatusUpdate = (newStatus: string) => {
    updateStatusMutation.mutate({ id: recruitmentId, status: newStatus });
  };

  return (
    <Select
      value={currentStatus}
      onValueChange={handleStatusUpdate}
      disabled={updateStatusMutation.isPending}
    >
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(statusLabels).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
