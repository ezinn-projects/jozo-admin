import http from "@/utils/http";

const PROMOTION_CONTROLLER = "/promotions";

export type PromotionPayload = {
  _id?: string;
  name: string;
  description: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  appliesTo: string[];
};

export type Promotion = {
  _id: string;
  name: string;
  description: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  appliesTo: string[];
};

export type PromotionResponse = HTTPResponse<Promotion[]>;

const promotionApis = {
  getAllPromotions: () => {
    return http.get<PromotionResponse>(`${PROMOTION_CONTROLLER}`);
  },
  getActivePromotion: () => {
    return http.get<HTTPResponse<Promotion>>(`${PROMOTION_CONTROLLER}/active`);
  },
  getPromotionById: (id: string) => {
    return http.get<HTTPResponse<Promotion>>(`${PROMOTION_CONTROLLER}/${id}`);
  },
  createPromotion: (payload: PromotionPayload) => {
    return http.post<HTTPResponse<{ id: string }>>(
      `${PROMOTION_CONTROLLER}`,
      payload
    );
  },
  updatePromotion: (payload: PromotionPayload) => {
    return http.put<HTTPResponse<{ modifiedCount: number }>>(
      `${PROMOTION_CONTROLLER}/${payload._id}`,
      payload
    );
  },
  deletePromotion: (payload: { _id: string }) => {
    return http.delete<HTTPResponse<{ deletedCount: number }>>(
      `${PROMOTION_CONTROLLER}/${payload._id}`
    );
  },
};

export default promotionApis;
