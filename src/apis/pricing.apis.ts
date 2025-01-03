import { PriceResponse } from "@/@types/general-management";
import { Price } from "@/@types/general-management";
import http from "@/utils/http";

const PRICING_CONTROLLER = "/pricing";

const pricingApis = {
  getPricingLists: () => {
    return http.get<PriceResponse>(`${PRICING_CONTROLLER}`);
  },
  getPricingById: (id: string) => {
    return http.get<HTTPResponse<Price>>(`${PRICING_CONTROLLER}/${id}`);
  },
  createPricing: (payload: Omit<Price, "_id">) => {
    return http.post<HTTPResponse<Price>>(`${PRICING_CONTROLLER}`, payload);
  },
  updatePricing: (payload: Price) => {
    return http.put<HTTPResponse<Price>>(
      `${PRICING_CONTROLLER}/${payload._id}`,
      payload
    );
  },
  deletePricing: (payload: { _id: string }) => {
    return http.delete<HTTPResponse<Price>>(
      `${PRICING_CONTROLLER}/${payload._id}`
    );
  },
  deletePricingByIds: (payload: { ids: string[] }) => {
    return http.delete<HTTPResponse<Price>>(
      `${PRICING_CONTROLLER}/delete-pricing-by-ids`,
      { data: payload }
    );
  },
};

export default pricingApis;
