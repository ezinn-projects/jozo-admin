import {
  ICoffeeTable,
  ICreateCoffeeTableRequestBody,
  IUpdateCoffeeTableRequestBody,
} from "@/@types/CoffeeTable";
import http from "@/utils/http";

const COFFEE_TABLE_CONTROLLER = "/coffee-tables";

const coffeeTableApis = {
  getCoffeeTables: () =>
    http.get<HTTPResponse<ICoffeeTable[]>>(COFFEE_TABLE_CONTROLLER),
  getCoffeeTableById: (id: string) =>
    http.get<HTTPResponse<ICoffeeTable>>(`${COFFEE_TABLE_CONTROLLER}/${id}`),
  createCoffeeTable: (payload: ICreateCoffeeTableRequestBody) =>
    http.post<HTTPResponse<ICoffeeTable>>(COFFEE_TABLE_CONTROLLER, payload),
  updateCoffeeTable: (id: string, payload: IUpdateCoffeeTableRequestBody) =>
    http.put<HTTPResponse<ICoffeeTable>>(`${COFFEE_TABLE_CONTROLLER}/${id}`, payload),
  deleteCoffeeTable: (id: string) =>
    http.delete<HTTPResponse<ICoffeeTable>>(`${COFFEE_TABLE_CONTROLLER}/${id}`),
};

export default coffeeTableApis;
