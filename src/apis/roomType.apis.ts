import http from "@/utils/http";

const ROOM_TYPES_CONTROLLER = "/room-types";

const roomTypeApis = {
  getRoomTypesLists: () => {
    return http.get<HTTPResponse<RoomTypeResponse>>(`${ROOM_TYPES_CONTROLLER}`);
  },
  addRoomType: (payload: Omit<RoomType, "id">) => {
    return http.post<HTTPResponse<RoomType>>(
      `${ROOM_TYPES_CONTROLLER}/add-room-type`,
      payload
    );
  },
  updateRoomType: (payload: RoomType) => {
    return http.put<HTTPResponse<RoomType>>(
      `${ROOM_TYPES_CONTROLLER}/${payload._id}`,
      payload
    );
  },
  deleteRoomType: (payload: { _id: string }) => {
    return http.delete<HTTPResponse<RoomType>>(
      `${ROOM_TYPES_CONTROLLER}/${payload._id}`
    );
  },
};

export default roomTypeApis;
