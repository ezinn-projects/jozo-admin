// src/hooks/useRoomSchedules.ts
import roomsScheduleApis from "@/apis/roomSchedule.api";
import { useQuery } from "@tanstack/react-query";
import { IRoomSchedule } from "@/@types/Room";
import dayjs, { Dayjs } from "dayjs";

export const useRoomSchedules = (date: Dayjs = dayjs()) => {
  return useQuery<IRoomSchedule[], Error>({
    queryKey: ["roomSchedules", date.toISOString()],
    queryFn: async () => {
      const response = await roomsScheduleApis.getRoomSchedules(date);
      if (!response.data.result) {
        return [];
      }
      return response.data.result;
    },
  });
};
