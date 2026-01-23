import { Song } from "@/@types/RoomMusic";
import http from "@/utils/http";

const ROOM_MUSIC_CONTROLLER = "/room-music";
const ROOMS_MUSIC_CONTROLLER = "/rooms-music";

const roomsMusicApis = {
  resolveRequest: (roomId: string) =>
    http.post<HTTPResponse>(
      `${ROOMS_MUSIC_CONTROLLER}/${roomId}/solve-request`
    ),
  getSongsCollection: () =>
    http.get<HTTPResponse<Song[]>>(
      `${ROOM_MUSIC_CONTROLLER}/songs-collection`
    ),
};

export default roomsMusicApis;
