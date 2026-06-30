// src/hooks/useRoomSchedules.ts
import { IRoomSchedule } from "@/@types/Room";
import roomApis from "@/apis/room.apis";
import roomsScheduleApis from "@/apis/roomSchedule.api";
import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs, { Dayjs } from "dayjs";

export const getRoomSchedulesQueryKey = (date: Dayjs | string) => {
  const normalized =
    typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? dayjs(date)
      : dayjs(date);
  return ["roomSchedules", normalized.startOf("day").toISOString()] as const;
};

export type RoomScheduleChangedAction =
  | "created"
  | "updated"
  | "cancelled"
  | "finished";

export const applyScheduleChangedToCache = (
  old: IRoomSchedule[] | undefined,
  action: RoomScheduleChangedAction,
  schedule: IRoomSchedule,
): IRoomSchedule[] | undefined => {
  if (!old) {
    return action === "created" ? [schedule] : old;
  }

  if (action === "created") {
    if (old.some((item) => item._id === schedule._id)) return old;
    return [...old, schedule];
  }

  const updated = old.map((item) =>
    item._id === schedule._id ? schedule : item,
  );

  if (action === "cancelled" || action === "finished") {
    return updated;
  }

  return updated.filter((item) => item.status?.toLowerCase() !== "cancelled");
};

export const useRoomSchedules = (date: Dayjs = dayjs()) => {
  const queryKey = getRoomSchedulesQueryKey(date);

  return useQuery<IRoomSchedule[], Error>({
    queryKey,
    queryFn: async () => {
      const response = await roomsScheduleApis.getRoomSchedules(queryKey[1]);
      if (!response.data.result) {
        return [];
      }
      return response.data.result;
    },
  });
};

export const useRoomSchedule = (scheduleId: string) => {
  return useQuery<IRoomSchedule, Error>({
    queryKey: ["roomSchedule", scheduleId],
    queryFn: async () => {
      const response = await roomsScheduleApis.getScheduleById(scheduleId);
      if (!response.data.result) {
        throw new Error("Schedule not found");
      }
      return response.data.result;
    },
  });
};

export const useResolveRequest = () => {
  return useMutation({
    mutationFn: roomApis.resolveRequest,
  });
};

export const useTurnOffAllRooms = () => {
  return useMutation({
    mutationFn: roomApis.turnOffAllRooms,
  });
};
