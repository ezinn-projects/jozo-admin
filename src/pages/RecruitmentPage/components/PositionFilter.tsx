import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const positionLabels = {
  cashier: "Nhân viên lễ tân",
  server: "Nhân viên phục vụ",
  parking: "Nhân viên giữ xe",
};

interface PositionFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const PositionFilter: React.FC<PositionFilterProps> = ({ value, onChange }) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Lọc theo vị trí" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Tất cả vị trí</SelectItem>
        {Object.entries(positionLabels).map(([positionValue, label]) => (
          <SelectItem key={positionValue} value={positionValue}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default PositionFilter;
