import {
  ICreateCoffeeSessionRequestBody,
  ICoffeeSession,
  IUpdateCoffeeSessionRequestBody,
} from "@/@types/CoffeeSession";
import http from "@/utils/http";

const COFFEE_SESSION_CONTROLLER = "/coffee-sessions";

interface GetCoffeeSessionsParams {
  date?: string;
  status?: string;
  tableId?: string;
}

const coffeeSessionApis = {
  getCoffeeSessions: (params?: GetCoffeeSessionsParams) =>
    http.get<HTTPResponse<ICoffeeSession[]>>(COFFEE_SESSION_CONTROLLER, {
      params,
    }),
  getCoffeeSessionById: (id: string) =>
    http.get<HTTPResponse<ICoffeeSession>>(`${COFFEE_SESSION_CONTROLLER}/${id}`),
  createCoffeeSession: (payload: ICreateCoffeeSessionRequestBody) =>
    http.post<HTTPResponse<ICoffeeSession>>(COFFEE_SESSION_CONTROLLER, payload),
  updateCoffeeSession: (id: string, payload: IUpdateCoffeeSessionRequestBody) =>
    http.patch<HTTPResponse<ICoffeeSession>>(
      `${COFFEE_SESSION_CONTROLLER}/${id}`,
      payload
    ),
};

export default coffeeSessionApis;
