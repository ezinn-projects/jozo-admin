import {
  GrantUserPointsPayload,
  IClaimGiftPayload,
  IMembershipConfig,
  IPendingGiftsResponse,
  IUserStreakInfo,
  MembershipConfigPayload,
  UpdateStreakPayload,
} from "@/@types/Membership";
import http from "@/utils/http";

const MEMBERSHIP_CONTROLLER = "/membership/config";
const MEMBERSHIP_MEMBER_CONTROLLER = "/membership/members";

const membershipApis = {
  getConfig: () =>
    http.get<HTTPResponse<IMembershipConfig>>(MEMBERSHIP_CONTROLLER),
  updateConfig: (payload: MembershipConfigPayload) =>
    http.put<HTTPResponse<IMembershipConfig>>(MEMBERSHIP_CONTROLLER, payload),
  updateMemberPoints: (id: string, payload: GrantUserPointsPayload) =>
    http.post<HTTPResponse>(
      `${MEMBERSHIP_MEMBER_CONTROLLER}/${id}/points`,
      payload,
    ),
  updateMemberStreak: (id: string, payload: UpdateStreakPayload) =>
    http.put<HTTPResponse>(
      `${MEMBERSHIP_MEMBER_CONTROLLER}/${id}/streak`,
      payload,
    ),
  getMemberStreakInfo: (id: string) =>
    http.get<HTTPResponse<IUserStreakInfo>>(
      `${MEMBERSHIP_MEMBER_CONTROLLER}/${id}/streak`,
    ),
  getPendingGifts: (phone: string) =>
    http.get<HTTPResponse<IPendingGiftsResponse>>(
      `/membership/pending-gifts?phone=${encodeURIComponent(phone)}`,
    ),
  claimGift: (payload: IClaimGiftPayload) =>
    http.post<HTTPResponse>(`/membership/claim-gift`, payload),
};

export default membershipApis;
