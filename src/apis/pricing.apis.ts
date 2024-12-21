import http from "@/utils/http";

const PRICING_CONTROLLER = "/pricing";

const pricingApis = {
  getPricingLists: () => {
    return http.get<PricingResponse>(`${PRICING_CONTROLLER}`);
  },
  createPricing: (payload: Omit<Pricing, "_id">) => {
    return http.post<HTTPResponse<Pricing>>(`${PRICING_CONTROLLER}`, payload);
  },
  updatePricing: (payload: Pricing) => {
    return http.put<HTTPResponse<Pricing>>(
      `${PRICING_CONTROLLER}/${payload._id}`,
      payload
    );
  },
  deletePricing: (payload: { _id: string }) => {
    return http.delete<HTTPResponse<Pricing>>(
      `${PRICING_CONTROLLER}/${payload._id}`
    );
  },
  deletePricingByIds: (payload: { ids: string[] }) => {
    return http.delete<HTTPResponse<Pricing>>(
      `${PRICING_CONTROLLER}/delete-pricing-by-ids`,
      { data: payload }
    );
  },
};

export default pricingApis;
