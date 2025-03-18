import { IRoom } from "@/@types/Room";
import { RoomType } from "@/constants/enum";
import http from "@/utils/http";

const ROOM_CONTROLLER = "/rooms";

// Interface cho RoomRequest (input API)
export interface IAddRoomRequestBody {
  roomName: string;
  roomType: RoomType;
  description?: string;
}

const roomApis = {
  createRoom: (payload: IRoom) => {
    return http.post<HTTPResponse<IRoom>>(
      `${ROOM_CONTROLLER}/add-room`,
      payload
    );
  },
  getRooms: () => {
    return http.get<HTTPResponse<IRoom[]>>(`${ROOM_CONTROLLER}`);
  },
  updateRoom: (payload: IRoom) => {
    return http.put<HTTPResponse<IRoom>>(
      `${ROOM_CONTROLLER}/${payload._id}`,
      payload
    );
  },
  getRoomById: (id: string) => {
    return http.get<HTTPResponse<IRoom>>(`${ROOM_CONTROLLER}/${id}`);
  },
  deleteRoom: (payload: { _id: string }) => {
    return http.delete<HTTPResponse<IRoom>>(
      `${ROOM_CONTROLLER}/${payload._id}`
    );
  },
  deleteRoomByIds: (payload: { ids: string[] }) => {
    return http.delete<HTTPResponse<IRoom>>(
      `${ROOM_CONTROLLER}/delete-room-by-ids`,
      { data: payload }
    );
  },
};

export default roomApis;
