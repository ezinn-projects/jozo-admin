import {
  GrantUserPointsPayload,
  IMembershipConfig,
  MembershipConfigPayload,
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
      payload
    ),
};

export default membershipApis;
