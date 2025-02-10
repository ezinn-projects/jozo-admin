import { IRoomType } from "@/@types/RoomType";
import http from "@/utils/http";

const ROOM_TYPE_CONTROLLER = "/room-types";

const roomTypeApis = {
  getRoomTypes: () => http.get<HTTPResponse<IRoomType[]>>(ROOM_TYPE_CONTROLLER),
  getRoomType: (id: string) =>
    http.get<HTTPResponse<IRoomType>>(`${ROOM_TYPE_CONTROLLER}/${id}`),
  createRoomType: (data: FormData) =>
    http.post<HTTPResponse<IRoomType>>(
      `${ROOM_TYPE_CONTROLLER}/add-room-type`,
      data
    ),
  updateRoomType: (data: FormData) =>
    http.put(`${ROOM_TYPE_CONTROLLER}/${data.get("_id")}`, data),
  deleteRoomType: ({ _id }: { _id: string }) =>
    http.delete(`${ROOM_TYPE_CONTROLLER}/${_id}`),
};

export default roomTypeApis;
