import {
  Game,
  GameType,
  ListGamesQuery,
  ListGameTypesQuery,
} from "@/@types/Game";
import http from "@/utils/http";

const GAMES_CONTROLLER = "/games";

const gameApis = {
  // Game type APIs
  getGameTypes: (params?: ListGameTypesQuery) =>
    http.get<HTTPResponse<GameType[]>>(`${GAMES_CONTROLLER}/types`, { params }),

  getGameTypeById: (typeId: string) =>
    http.get<HTTPResponse<GameType>>(`${GAMES_CONTROLLER}/types/${typeId}`),

  createGameType: (data: FormData) =>
    http.post<HTTPResponse<GameType>>(`${GAMES_CONTROLLER}/types`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  updateGameType: (typeId: string, data: FormData) =>
    http.put<HTTPResponse<GameType>>(`${GAMES_CONTROLLER}/types/${typeId}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  deleteGameType: (typeId: string) =>
    http.delete<HTTPResponse<{ deletedCount: number }>>(
      `${GAMES_CONTROLLER}/types/${typeId}`
    ),

  // Game APIs
  getGames: (params?: ListGamesQuery) =>
    http.get<HTTPResponse<Game[]>>(GAMES_CONTROLLER, { params }),

  getGameById: (id: string) =>
    http.get<HTTPResponse<Game>>(`${GAMES_CONTROLLER}/${id}`),

  createGame: (data: FormData) =>
    http.post<HTTPResponse<Game>>(GAMES_CONTROLLER, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  updateGame: (id: string, data: FormData) =>
    http.put<HTTPResponse<Game>>(`${GAMES_CONTROLLER}/${id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  deleteGame: (id: string) =>
    http.delete<HTTPResponse<{ deletedCount: number }>>(`${GAMES_CONTROLLER}/${id}`),
};

export default gameApis;
