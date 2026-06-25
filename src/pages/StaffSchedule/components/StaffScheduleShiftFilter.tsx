import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShiftType } from "@/constants/enum";

export type ShiftFilter = "all" | ShiftType;

export const SHIFT_DEFINITIONS = [
  { type: ShiftType.Morning, label: "Ca 1", time: "09:00–14:00" },
  { type: ShiftType.Afternoon, label: "Ca 2", time: "14:00–19:00" },
  { type: ShiftType.All, label: "Ca 3", time: "19:00–01:00" },
] as const;

const SHIFT_FILTER_OPTIONS: { value: ShiftFilter; label: string }[] = [
  { value: "all", label: "Tất cả ca" },
  { value: ShiftType.Morning, label: "Ca 1" },
  { value: ShiftType.Afternoon, label: "Ca 2" },
  { value: ShiftType.All, label: "Ca 3" },
];

export const getVisibleShifts = (shiftFilter: ShiftFilter) =>
  shiftFilter === "all"
    ? SHIFT_DEFINITIONS
    : SHIFT_DEFINITIONS.filter((s) => s.type === shiftFilter);

interface StaffScheduleShiftFilterProps {
  value: ShiftFilter;
  onChange: (value: ShiftFilter) => void;
  className?: string;
}

const StaffScheduleShiftFilter = ({
  value,
  onChange,
  className,
}: StaffScheduleShiftFilterProps) => (
  <Tabs
    value={value}
    onValueChange={(v) => onChange(v as ShiftFilter)}
    className={className}
  >
    <TabsList className="grid w-full grid-cols-4 h-10">
      {SHIFT_FILTER_OPTIONS.map((option) => (
        <TabsTrigger
          key={option.value}
          value={option.value}
          className="text-xs px-1"
        >
          {option.label}
        </TabsTrigger>
      ))}
    </TabsList>
  </Tabs>
);

export default StaffScheduleShiftFilter;
