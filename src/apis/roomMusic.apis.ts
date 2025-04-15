import http from "@/utils/http";

const ROOMS_MUSIC_CONTROLLER = "/rooms-music";

const roomsMusicApis = {
  resolveRequest: (roomId: string) =>
    http.post<HTTPResponse>(
      `${ROOMS_MUSIC_CONTROLLER}/${roomId}/solve-request`
    ),
};

export default roomsMusicApis;
