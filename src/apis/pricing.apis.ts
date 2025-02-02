import { PriceResponse } from "@/@types/general-management";
import { Price } from "@/@types/general-management";
import { DayType, RoomType } from "@/constants/enum";
import http from "@/utils/http";

const PRICING_CONTROLLER = "/price";

export type PricePayload = {
  _id?: string;
  dayType: DayType;
  effectiveDate: string;
  timeSlots: Array<{
    start: string;
    end: string;
    prices: Array<{
      roomType: RoomType;
      price: number;
    }>;
  }>;
  endDate?: string;
  note?: string;
};

const pricingApis = {
  getPricingLists: () => {
    return http.get<PriceResponse>(`${PRICING_CONTROLLER}`);
  },
  getPricingById: (id: string) => {
    return http.get<HTTPResponse<Price>>(`${PRICING_CONTROLLER}/${id}`);
  },
  createPricing: (payload: PricePayload) => {
    return http.post<HTTPResponse<Price>>(`${PRICING_CONTROLLER}`, payload);
  },
  updatePricing: (payload: PricePayload) => {
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
