import { ICoffeeSession } from "@/@types/CoffeeSession";
import dayjs, { Dayjs } from "dayjs";

export const normalizeCoffeeSessionStatus = (
  status?: string | null
): "booked" | "in-use" | "completed" | null => {
  const normalized = status?.trim().toLowerCase().replace(/\s+/g, "-");

  if (normalized === "booked") return "booked";
  if (normalized === "in-use") return "in-use";
  if (normalized === "completed") return "completed";

  return null;
};

export const getCoffeeSessionTableId = (session: ICoffeeSession) =>
  session.tableId || session.coffeeTableId || "";

export const getCoffeeSessionDisplayStart = (session: ICoffeeSession): Dayjs => {
  return dayjs(
    session.startTime ||
      session.scheduledStartTime ||
      session.createdAt ||
      new Date()
  );
};

export const getCoffeeSessionDisplayEnd = (
  session: ICoffeeSession,
  now: Dayjs = dayjs()
): Dayjs => {
  if (session.endTime) {
    return dayjs(session.endTime);
  }

  const start = getCoffeeSessionDisplayStart(session);
  const status = normalizeCoffeeSessionStatus(session.status);
  const expectedDurationMinutes =
    session.expectedDurationMinutes && session.expectedDurationMinutes > 0
      ? session.expectedDurationMinutes
      : 120;

  if (status === "booked") {
    return start.add(expectedDurationMinutes, "minute");
  }

  if (status === "in-use") {
    return now.isAfter(start) ? now : start.add(1, "minute");
  }

  return start.add(60, "minute");
};

export const getCoffeeSessionStatusLabel = (status?: string | null) => {
  const normalized = normalizeCoffeeSessionStatus(status);

  if (normalized === "booked") return "Đã giữ bàn";
  if (normalized === "in-use") return "Đang sử dụng";
  if (normalized === "completed") return "Hoàn tất";

  return status || "Không xác định";
};
