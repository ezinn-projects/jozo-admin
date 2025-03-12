import { IRoomSchedule } from "@/@types/Room";
import http from "@/utils/http";
import dayjs, { Dayjs } from "dayjs";

const roomsScheduleApis = {
  getRoomSchedules: (date: Dayjs = dayjs()) =>
    http.get<HTTPResponse<IRoomSchedule[]>>("/room-schedule", {
      params: {
        date,
      },
    }),
};
export default roomsScheduleApis;
