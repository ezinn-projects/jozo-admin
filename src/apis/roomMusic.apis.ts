import { Song } from "@/@types/RoomMusic";
import http from "@/utils/http";

const ROOM_MUSIC_CONTROLLER = "/room-music";
const ROOMS_MUSIC_CONTROLLER = "/rooms-music";

interface SongsCollectionResponse {
  songs: Song[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const roomsMusicApis = {
  resolveRequest: (roomId: string) =>
    http.post<HTTPResponse>(
      `${ROOMS_MUSIC_CONTROLLER}/${roomId}/solve-request`
    ),
  getSongsCollection: (params?: {
    page?: number;
    limit?: number;
    keyword?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) {
      queryParams.append("page", params.page.toString());
    }
    if (params?.limit) {
      queryParams.append("limit", params.limit.toString());
    }
    if (params?.keyword) {
      queryParams.append("keyword", params.keyword);
    }
    const queryString = queryParams.toString();
    return http.get<HTTPResponse<SongsCollectionResponse>>(
      `${ROOM_MUSIC_CONTROLLER}/songs-collection${queryString ? `?${queryString}` : ""}`
    );
  },
  normalizeSongs: () =>
    http.post<HTTPResponse>(
      `${ROOM_MUSIC_CONTROLLER}/songs/normalize`
    ),
  deleteSong: (videoId: string) =>
    http.delete<HTTPResponse>(
      `${ROOM_MUSIC_CONTROLLER}/songs-collection/${videoId}`
    ),
};

export default roomsMusicApis;
