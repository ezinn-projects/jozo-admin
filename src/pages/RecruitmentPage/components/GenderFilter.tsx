import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const genderLabels = {
  male: "Nam",
  female: "Nữ",
  other: "Khác",
};

interface GenderFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const GenderFilter: React.FC<GenderFilterProps> = ({ value, onChange }) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Lọc theo giới tính" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Tất cả</SelectItem>
        {Object.entries(genderLabels).map(([genderValue, label]) => (
          <SelectItem key={genderValue} value={genderValue}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default GenderFilter;
