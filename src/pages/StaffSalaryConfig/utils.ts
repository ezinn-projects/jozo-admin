export const formatVndInput = (value?: number | string) => {
  const numericValue = Number(value || 0);

  if (!Number.isFinite(numericValue)) {
    return "";
  }

  return numericValue.toLocaleString("vi-VN");
};

export const parseVndInput = (value: string) => {
  const digitsOnly = value.replace(/[^\d]/g, "");
  return digitsOnly ? Number(digitsOnly) : 0;
};

export const HOURS_IN_DAY = 24;

export const buildHourlyRateMap = (
  source?: Partial<Record<string, number>>,
  fallbackRate = 0
) => {
  const map: Record<string, number> = {};

  for (let hour = 0; hour < HOURS_IN_DAY; hour += 1) {
    const key = String(hour);
    const value = source?.[key];
    map[key] = Number.isFinite(value) ? Number(value) : fallbackRate;
  }

  return map;
};

export const buildHourlyShiftMap = (
  source?: Partial<Record<string, "shift1" | "shift2" | "shift3" | null>>
) => {
  const map: Record<string, "shift1" | "shift2" | "shift3" | null> = {};

  for (let hour = 0; hour < HOURS_IN_DAY; hour += 1) {
    const key = String(hour);
    const value = source?.[key];
    map[key] = value === "shift1" || value === "shift2" || value === "shift3" ? value : null;
  }

  return map;
};

export const formatHourLabel = (hour: number) =>
  `${String(hour).padStart(2, "0")}:00`;
