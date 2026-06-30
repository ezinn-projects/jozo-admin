import {
  IStreakGiftsResponse,
  IStreakRewardProgress,
} from "@/@types/Membership";

type RawStreakGiftRef = {
  giftId?: string;
  giftName?: string;
  giftType?: string;
  giftImage?: string;
};

type RawStreakReward = {
  streakCount: number;
  bonusPoints?: number;
  gift?: RawStreakGiftRef;
  giftId?: string;
  giftName?: string;
  giftType?: string;
  giftImage?: string;
  isClaimed?: boolean;
  isReached?: boolean;
  claimed?: boolean;
  isNext?: boolean;
};

type RawStreakGiftsResponse = Omit<IStreakGiftsResponse, "streakRewards"> & {
  streakRewards?: RawStreakReward[];
};

const normalizeStreakReward = (raw: RawStreakReward): IStreakRewardProgress => {
  const gift = raw.gift ?? {};
  return {
    streakCount: raw.streakCount,
    giftId: gift.giftId ?? raw.giftId,
    giftName: gift.giftName ?? raw.giftName,
    giftType: gift.giftType ?? raw.giftType,
    giftImage: gift.giftImage ?? raw.giftImage,
    bonusPoints: raw.bonusPoints,
    claimed: raw.isClaimed ?? raw.claimed ?? false,
    isNext: raw.isNext,
  };
};

export const normalizeStreakGiftsResponse = (
  data: RawStreakGiftsResponse | undefined,
): IStreakGiftsResponse | undefined => {
  if (!data) return undefined;

  const rawRewards = data.streakRewards ?? [];
  const streakRewards = rawRewards.map(normalizeStreakReward);
  const nextMilestone = rawRewards
    .filter((raw) => !(raw.isClaimed ?? raw.claimed) && raw.isReached === false)
    .sort((a, b) => a.streakCount - b.streakCount)[0]?.streakCount;

  return {
    ...data,
    streakRewards: streakRewards.map((reward) => ({
      ...reward,
      isNext:
        reward.isNext ??
        (!reward.claimed &&
          nextMilestone !== undefined &&
          reward.streakCount === nextMilestone),
    })),
  };
};

const FNB_CATEGORY_LABELS: Record<string, string> = {
  drink: "Đồ uống",
  drinks: "Đồ uống",
  snack: "Đồ ăn",
  snacks: "Đồ ăn",
};

export const formatFnBCategory = (category?: string) => {
  if (!category) return null;
  return FNB_CATEGORY_LABELS[category.toLowerCase()] ?? category;
};

type GiftRef = {
  giftId?: string;
  giftType?: string;
};

export const collectSnacksGiftIds = (
  availableGifts: GiftRef[],
  streakRewards: GiftRef[],
) => {
  const ids = new Set<string>();
  for (const entry of [...availableGifts, ...streakRewards]) {
    if (entry.giftType === "snacks_drinks" && entry.giftId) {
      ids.add(entry.giftId);
    }
  }
  return [...ids];
};
