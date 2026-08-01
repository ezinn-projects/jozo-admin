// Membership configuration types
import type { GiftBundleItem } from "./Gift";
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

export type UpdateStreakPayload = {
  count?: number;
  reset?: boolean;
};

// Pending gift từ reward history
export interface IPendingGift {
  rewardHistoryId: string;
  giftId: string;
  giftName: string;
  giftType: string;
  giftImage?: string;
  streakCount: number;
  assignedAt: string;
}

// Eligible gift chưa được assign
export interface IEligibleGift {
  streakCount: number;
  giftId: string;
  giftName: string;
  giftType: string;
  giftImage?: string;
  bonusPoints?: number;
}

// User info trong response
export interface IPendingGiftsUserProgress {
  currentTier: string;
  nextTier?: {
    tier: string;
    required: number;
  };
}

export interface IPendingGiftsUser {
  userId: string;
  full_name?: string | null;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  phone_number: string;
  date_of_birth?: string | null;
  avatar?: string | null;
  tier: string;
  availablePoint: number;
  lifetimePoint?: number;
  totalPoint?: number;
  streakCount: number;
  progress?: IPendingGiftsUserProgress;
}

// Response từ GET /pending-gifts
export interface IPendingGiftsResponse {
  user: IPendingGiftsUser;
  pending: IPendingGift[];
  eligible: IEligibleGift[];
}

// Payload cho POST /claim-gift
export interface IClaimGiftPayload {
  phone: string;
  streakCount: number;
  scheduleId: string;
}

// Quà streak sẵn sàng phục vụ — GET /streak-gifts
export interface IAvailableStreakGift {
  streakCount: number;
  giftId: string;
  giftName: string;
  giftType: string;
  giftImage?: string;
  bonusPoints?: number;
  /** Chi tiết món FNB nếu BE trả kèm */
  items?: GiftBundleItem[];
}

// Tiến độ mốc streak — GET /streak-gifts
export interface IStreakRewardProgress {
  streakCount: number;
  giftId?: string;
  giftName?: string;
  giftType?: string;
  giftImage?: string;
  bonusPoints?: number;
  claimed: boolean;
  isNext?: boolean;
  /** Chi tiết món FNB nếu BE trả kèm */
  items?: GiftBundleItem[];
}

// Response từ GET /streak-gifts
export interface IStreakGiftsResponse {
  user: IPendingGiftsUser;
  availableGifts: IAvailableStreakGift[];
  streakRewards: IStreakRewardProgress[];
}

// Payload cho POST /membership/serve-streak-gift
export interface IServeStreakGiftPayload {
  phone: string;
  streakCount: number;
  scheduleId: string;
}

// Streak Info Response - GET /membership/members/:userId/streak
export interface IUserStreak {
  _id: string;
  userId: string;
  count: number;
  lastVisitAt: string;
  expiredAt: string;
  windowDays: number;
  createdAt: string;
  updatedAt: string;
  isExpired: boolean;
  isActive: boolean;
}

export interface IClaimedRewardGift {
  giftId: string;
  giftName: string;
  giftType: string;
}

export interface IClaimedReward {
  streakCount: number;
  points?: number;
  gift?: IClaimedRewardGift;
  claimedAt: string;
}

export interface IUserStreakInfo {
  streak: IUserStreak;
  claimedRewards: IClaimedReward[];
}

export type UserStreakInfoResponse = HTTPResponse<IUserStreakInfo>;
