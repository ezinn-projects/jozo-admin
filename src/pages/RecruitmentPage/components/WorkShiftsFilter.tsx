import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const workShiftsLabels = {
  morning: "Ca sáng (12:00-17:00)",
  evening: "Ca tối (17:00-22:00)",
};

interface WorkShiftsFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const WorkShiftsFilter: React.FC<WorkShiftsFilterProps> = ({
  value,
  onChange,
}) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Lọc theo ca làm việc" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Tất cả ca</SelectItem>
        {Object.entries(workShiftsLabels).map(([shiftValue, label]) => (
          <SelectItem key={shiftValue} value={shiftValue}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default WorkShiftsFilter;
