import { Gift, GiftCreateRequest } from "@/@types/Gift";
import http from "@/utils/http";

const giftApis = {
  listGifts: () => http.get<HTTPResponse<Gift[]>>("/gifts"),

  createGift: (data: FormData) =>
    http.postForm<HTTPResponse<Gift>>("/gifts", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  updateGift: (id: string, data: FormData) =>
    http.patch<HTTPResponse<Gift>>(`/gifts/${id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  deleteGift: (id: string) => http.delete<HTTPResponse<Gift>>(`/gifts/${id}`),

  getGiftById: (id: string) =>
    http.get<HTTPResponse<Gift>>(`/gifts/${id}`),
};

export default giftApis;

