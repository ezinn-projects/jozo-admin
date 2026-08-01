import { GiftBundleItem } from "@/@types/Gift";
import {
  IAvailableStreakGift,
  IStreakGiftsResponse,
  IStreakRewardProgress,
} from "@/@types/Membership";
import { FnBCategory } from "@/constants/enum";

type RawStreakGiftItem = {
  itemId?: string;
  quantity?: number;
  name?: string;
  category?: string;
  priceSnapshot?: number;
  source?: "fnb_menu" | "fnb_menu_item";
};

type RawStreakGiftRef = {
  giftId?: string;
  giftName?: string;
  giftType?: string;
  giftImage?: string;
  items?: RawStreakGiftItem[];
};

type RawStreakReward = {
  streakCount: number;
  bonusPoints?: number;
  gift?: RawStreakGiftRef;
  giftId?: string;
  giftName?: string;
  giftType?: string;
  giftImage?: string;
  items?: RawStreakGiftItem[];
  isClaimed?: boolean;
  isReached?: boolean;
  claimed?: boolean;
  isNext?: boolean;
};

type RawAvailableGift = IAvailableStreakGift & {
  gift?: RawStreakGiftRef;
  items?: RawStreakGiftItem[];
};

type RawStreakGiftsResponse = Omit<
  IStreakGiftsResponse,
  "streakRewards" | "availableGifts"
> & {
  availableGifts?: RawAvailableGift[];
  streakRewards?: RawStreakReward[];
};

const normalizeGiftItems = (
  items?: RawStreakGiftItem[],
): GiftBundleItem[] | undefined => {
  if (!items?.length) return undefined;
  const normalized = items
    .filter((item): item is RawStreakGiftItem & { itemId: string } =>
      Boolean(item.itemId),
    )
    .map((item) => ({
      itemId: item.itemId,
      quantity: item.quantity ?? 1,
      name: item.name ?? "Món",
      category: item.category as FnBCategory | undefined,
      priceSnapshot: item.priceSnapshot,
      source: item.source ?? "fnb_menu_item",
    }));
  return normalized.length > 0 ? normalized : undefined;
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
    items: normalizeGiftItems(gift.items ?? raw.items),
    claimed: raw.isClaimed ?? raw.claimed ?? false,
    isNext: raw.isNext,
  };
};

const normalizeAvailableGift = (
  raw: RawAvailableGift,
): IAvailableStreakGift => {
  const gift = raw.gift ?? {};
  return {
    streakCount: raw.streakCount,
    giftId: gift.giftId ?? raw.giftId,
    giftName: gift.giftName ?? raw.giftName,
    giftType: gift.giftType ?? raw.giftType,
    giftImage: gift.giftImage ?? raw.giftImage,
    bonusPoints: raw.bonusPoints,
    items: normalizeGiftItems(gift.items ?? raw.items),
  };
};

export const normalizeStreakGiftsResponse = (
  data: RawStreakGiftsResponse | undefined,
): IStreakGiftsResponse | undefined => {
  if (!data) return undefined;

  const rawRewards = data.streakRewards ?? [];
  const streakRewards = rawRewards.map(normalizeStreakReward);
  const availableGifts = (data.availableGifts ?? []).map(normalizeAvailableGift);
  const nextMilestone = rawRewards
    .filter((raw) => !(raw.isClaimed ?? raw.claimed) && raw.isReached === false)
    .sort((a, b) => a.streakCount - b.streakCount)[0]?.streakCount;

  return {
    ...data,
    availableGifts,
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
  items?: GiftBundleItem[];
};

/** Thu thập giftId snacks_drinks còn thiếu items từ response streak-gifts. */
export const collectSnacksGiftIds = (
  availableGifts: GiftRef[],
  streakRewards: GiftRef[],
) => {
  const ids = new Set<string>();
  for (const entry of [...availableGifts, ...streakRewards]) {
    if (
      entry.giftType === "snacks_drinks" &&
      entry.giftId &&
      !entry.items?.length
    ) {
      ids.add(entry.giftId);
    }
  }
  return [...ids];
};

/** Ghép items có sẵn từ streak-gifts với items fetch theo giftId. */
export const mergeGiftItemsById = (
  availableGifts: GiftRef[],
  streakRewards: GiftRef[],
  fetchedItemsById: Record<string, GiftBundleItem[]>,
): Record<string, GiftBundleItem[]> => {
  const map: Record<string, GiftBundleItem[]> = { ...fetchedItemsById };
  for (const entry of [...availableGifts, ...streakRewards]) {
    if (entry.giftId && entry.items?.length && !map[entry.giftId]) {
      map[entry.giftId] = entry.items;
    }
  }
  return map;
};
