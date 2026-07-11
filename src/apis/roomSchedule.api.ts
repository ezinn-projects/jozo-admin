import { IRoomSchedule } from "@/@types/Room";
import { RoomStatus, RoomType } from "@/constants/enum";
import http from "@/utils/http";

// Create a new interface for creating room schedules
interface ICreateRoomScheduleRequest {
  roomId: string;
  startTime: string;
  endTime: string | null;
  status: RoomStatus;
  note?: string;
  customerPhone?: string;
  giftEnabled?: boolean;
  /** Gửi `null` hoặc `""` để xóa promotion đã chọn */
  promotionId?: string | null;
  applyFreeHourPromo?: boolean;
  roomType?: RoomType;
}

interface IChangeRoomRequest {
  roomId: string;
  startTime: string;
  endTime: string | null;
  status: RoomStatus;
  newRoomId: string;
  roomChangeNote?: string;
  updatedBy?: string;
  roomType?: RoomType;
}

const SCHEDULE_CONTROLLER = "/room-schedule";

const roomsScheduleApis = {
  getRoomSchedules: (date: string) =>
    http.get<HTTPResponse<IRoomSchedule[]>>(SCHEDULE_CONTROLLER, {
      params: {
        date,
      },
    }),
  updateSchedule: (
    id: string,
    schedule: Partial<ICreateRoomScheduleRequest & IChangeRoomRequest>
  ) => http.put<HTTPResponse>(`${SCHEDULE_CONTROLLER}/${id}`, schedule),
  /** BE tự chuyển queue nhạc khi payload có `newRoomId` — không cần gọi move-queue riêng */
  changeRoom: (id: string, payload: IChangeRoomRequest) =>
    http.put<HTTPResponse>(`${SCHEDULE_CONTROLLER}/${id}`, payload),
  deleteSchedule: (id: string) =>
    http.delete<HTTPResponse<IRoomSchedule>>(`${SCHEDULE_CONTROLLER}/${id}`),
  createSchedule: (schedule: ICreateRoomScheduleRequest) =>
    http.post<HTTPResponse<string>>(SCHEDULE_CONTROLLER, schedule),
  getScheduleById: (id: string) =>
    http.get<HTTPResponse<IRoomSchedule>>(`${SCHEDULE_CONTROLLER}/${id}`),
};
export default roomsScheduleApis;
export type { ICreateRoomScheduleRequest, IChangeRoomRequest };
