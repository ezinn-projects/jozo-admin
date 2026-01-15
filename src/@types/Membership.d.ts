// Membership configuration types
import type { User } from "./user";

type ObjectId = string;

export interface ITierBenefit {
  giftId: ObjectId;
  note?: string;
}

export interface IMembershipConfig {
  _id?: ObjectId;
  currencyUnit: number;
  pointPerCurrency: number;
  tierThresholds: Record<string, number>;
  bonusRules?: IBonusRules;
  streak?: IStreakConfig;
  tierBenefits?: Record<string, ITierBenefit[]>;
  dailySelfClaimLimitPerPhone?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBonusRules {
  bookingEarlyBonus?: number; // +points khi đặt trước
  offPeakBonus?: number; // +points khi đi giờ thấp điểm
  groupSizeBonus?: {
    sizeGte: number;
    points: number;
  };
  birthdayMultiplier?: number; // nhân điểm khi sinh nhật
}

export interface IStreakConfig {
  windowDays: number;
  rewards: IStreakReward[];
}

export interface IStreakReward {
  count: number;
  bonusPoints: number;
  giftId?: ObjectId;
}

export type MembershipConfigResponse = HTTPResponse<IMembershipConfig>;

export type MembershipConfigPayload = Omit<
  IMembershipConfig,
  "_id" | "createdAt" | "updatedAt"
> & { _id?: string };

export interface IUserMembershipUser extends User {
  points?: number;
  loyalty_points?: number;
  loyalty?: number;
  streak?: number;
  current_streak?: number;
  tier?: string;
}

export interface IUserMembershipProgressTier {
  tier: string;
  required?: number;
  points?: number;
}

export interface IUserMembershipProgress {
  currentTier?: IUserMembershipProgressTier | string | null;
  nextTier?: IUserMembershipProgressTier | null;
}

export interface IUserMembershipDetail {
  user: IUserMembershipUser;
  config?: IMembershipConfig;
  progress?: IUserMembershipProgress;
}

export type UserMembershipDetailResponse = HTTPResponse<IUserMembershipDetail>;

export type GrantUserPointsPayload = {
  points: number;
  reason?: string;
};
