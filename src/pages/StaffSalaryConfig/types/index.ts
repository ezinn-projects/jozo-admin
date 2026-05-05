export type ShiftType = "shift1" | "shift2" | "shift3";

export type SalaryFormValues = {
  hourlyRateMap: Record<string, number>;
  hourlyShiftMap: Record<string, ShiftType | null>;
};
