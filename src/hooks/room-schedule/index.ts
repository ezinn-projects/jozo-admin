// src/hooks/useRoomSchedules.ts
import roomsScheduleApis from "@/apis/roomSchedule.api";
import { useQuery } from "@tanstack/react-query";
import { IRoomSchedule } from "@/@types/Room";
import dayjs, { Dayjs } from "dayjs";

export const useRoomSchedules = (date: Dayjs = dayjs()) => {
  return useQuery<IRoomSchedule[], Error>({
    queryKey: ["roomSchedules", date.toISOString()],
    queryFn: async () => {
      const response = await roomsScheduleApis.getRoomSchedules(
        date.toISOString()
      );
      if (!response.data.result) {
        return [];
      }
      return response.data.result;
    },
    refetchInterval: 60 * 1000, // Refetch every minute
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
