import {
  ICoffeeSessionOrderDetail,
  IUpdateCoffeeSessionOrderRequestBody,
} from "@/@types/CoffeeSessionOrder";
import http from "@/utils/http";

const COFFEE_SESSION_ORDER_CONTROLLER = "/coffee-session-orders";

const coffeeSessionOrderApis = {
  getCoffeeSessionOrder: (coffeeSessionId: string) =>
    http.get<HTTPResponse<ICoffeeSessionOrderDetail>>(
      `${COFFEE_SESSION_ORDER_CONTROLLER}/${coffeeSessionId}`
    ),
  updateCoffeeSessionOrder: (
    coffeeSessionId: string,
    payload: IUpdateCoffeeSessionOrderRequestBody
  ) =>
    http.put<HTTPResponse<ICoffeeSessionOrderDetail>>(
      `${COFFEE_SESSION_ORDER_CONTROLLER}/${coffeeSessionId}`,
      payload
    ),
  deleteCoffeeSessionOrder: (coffeeSessionId: string) =>
    http.delete<HTTPResponse>(`${COFFEE_SESSION_ORDER_CONTROLLER}/${coffeeSessionId}`),
};

export default coffeeSessionOrderApis;
