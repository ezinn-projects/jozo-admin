import { RoomStatus } from "@/pages/RoomsManagement/constants/enum";
import { RoomType } from "@/constants/enum";
import http from "@/utils/http";
import { IRoom } from "@/@types/Room";

const ROOM_CONTROLLER = "/rooms";

// Interface cho RoomRequest (input API)
export interface IAddRoomRequestBody {
  roomName: string;
  roomType: RoomType;
  maxCapacity: number;
  status: RoomStatus;
  description?: string;
  images?: string[];
}

const roomApis = {
  createRoom: async (payload: FormData) => {
    return http.postForm<HTTPResponse<IRoom>>(
      `${ROOM_CONTROLLER}/add-room`,
      payload
    );
  },
  getRooms: async () => {
    return http.get<HTTPResponse<IRoom[]>>(`${ROOM_CONTROLLER}`);
  },
  updateRoom: async (payload: FormData) => {
    return http.postForm<HTTPResponse<IRoom>>(
      `${ROOM_CONTROLLER}/update-room`,
      payload
    );
  },
  getRoomById: async (id: string) => {
    return http.get<HTTPResponse<IRoom>>(`${ROOM_CONTROLLER}/${id}`);
  },
  deleteRoom: async (payload: { _id: string }) => {
    return http.delete<HTTPResponse<IRoom>>(
      `${ROOM_CONTROLLER}/${payload._id}`
    );
  },
  deleteRoomByIds: async (payload: { ids: string[] }) => {
    return http.delete<HTTPResponse<IRoom>>(
      `${ROOM_CONTROLLER}/delete-room-by-ids`,
      { data: payload }
    );
  },
};

export default roomApis;
