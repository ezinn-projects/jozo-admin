import { IRoomSchedule } from "@/@types/Room";
import { RoomStatus } from "@/constants/enum";
import http from "@/utils/http";

// Create a new interface for creating room schedules
interface ICreateRoomScheduleRequest {
  roomId: string;
  startTime: string;
  endTime: string | null;
  status: RoomStatus;
  note?: string;
}

const roomsScheduleApis = {
  getRoomSchedules: (date: string) =>
    http.get<HTTPResponse<IRoomSchedule[]>>("/room-schedule", {
      params: {
        date,
      },
    }),
  updateSchedule: (id: string, schedule: Partial<ICreateRoomScheduleRequest>) =>
    http.put<HTTPResponse>(`/room-schedule/${id}`, schedule),
  deleteSchedule: (id: string) =>
    http.delete<HTTPResponse<IRoomSchedule>>(`/room-schedule/${id}`),
  createSchedule: (schedule: ICreateRoomScheduleRequest) =>
    http.post<HTTPResponse<IRoomSchedule>>(`/room-schedule`, schedule),
  getScheduleById: (id: string) =>
    http.get<HTTPResponse<IRoomSchedule>>(`/room-schedule/${id}`),
};
export default roomsScheduleApis;
export type { ICreateRoomScheduleRequest };
