import {
  IAvailableStreakGift,
  IStreakReward,
  IStreakRewardProgress,
} from "@/@types/Membership";
import { cn } from "@/lib/utils";
import { Flame, Gift, Loader2, Star, User } from "lucide-react";
import React, { useMemo } from "react";
import {
  getMemberDisplayName,
  isValidMemberPhone,
} from "../utils/memberPhone";
import {
  formatStreakRewardLabel,
  getClaimableStreakRows,
  resolveStreakRewardsFromConfig,
} from "../utils/streakConfigRewards";

export interface MemberLookupUser {
  full_name?: string | null;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  phone_number: string;
  tier?: string;
  availablePoint?: number;
  streakCount?: number;
}

interface MemberPhoneLookupCardProps {
  phone: string;
  isLoading?: boolean;
  isError?: boolean;
  isNotFound?: boolean;
  memberInfo?: MemberLookupUser | null;
  availableGifts?: IAvailableStreakGift[];
  streakRewards?: IStreakRewardProgress[];
  configStreakRewards?: IStreakReward[];
  className?: string;
}

/** Chỉ hiện quà còn nhận được khi nhập SĐT (modal tạo schedule). */
const MemberPhoneLookupCard: React.FC<MemberPhoneLookupCardProps> = ({
  phone,
  isLoading = false,
  isError = false,
  isNotFound = false,
  memberInfo,
  availableGifts = [],
  streakRewards = [],
  configStreakRewards = [],
  className,
}) => {
  const streakCount = Number(memberInfo?.streakCount ?? 0) || 0;

  const claimedCounts = useMemo(() => {
    const set = new Set<number>();
    for (const reward of streakRewards) {
      if (reward.claimed === true || reward.isClaimed === true) {
        set.add(Number(reward.streakCount));
      }
    }
    return set;
  }, [streakRewards]);

  const claimableRows = useMemo(
    () =>
      getClaimableStreakRows({
        streakCount,
        configRewards: configStreakRewards,
        availableGifts,
        claimedStreakCounts: claimedCounts,
      }),
    [streakCount, configStreakRewards, availableGifts, claimedCounts],
  );

  const nextReward = useMemo(() => {
    if (claimableRows.length > 0) return undefined;
    return resolveStreakRewardsFromConfig(
      streakCount,
      configStreakRewards,
    ).find((r) => r.isNext);
  }, [claimableRows.length, streakCount, configStreakRewards]);

  if (!isValidMemberPhone(phone)) return null;

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground",
          className,
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Đang tìm...
      </div>
    );
  }

  if (isError || isNotFound || !memberInfo) {
    return (
      <div
        className={cn(
          "rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800",
          className,
        )}
      >
        Không tìm thấy member
      </div>
    );
  }

  return (
    <div className={cn("rounded-md border px-3 py-2.5 space-y-2.5", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <User className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {getMemberDisplayName(memberInfo)}
              {memberInfo.tier ? (
                <span className="ml-1.5 font-normal text-muted-foreground">
                  · {memberInfo.tier}
                </span>
              ) : null}
            </p>
            <p className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                Streak {streakCount}
              </span>
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-yellow-500" />
                {(memberInfo.availablePoint ?? 0).toLocaleString()} điểm
              </span>
            </p>
          </div>
        </div>
      </div>

      {claimableRows.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Gift className="h-3.5 w-3.5" />
            Quà chưa nhận
          </p>
          {claimableRows.map((row) => (
            <div
              key={row.streakCount}
              className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2.5 py-2 text-sm"
            >
              <span>Streak {row.streakCount}</span>
              <span className="font-medium">
                {formatStreakRewardLabel(row)}
              </span>
            </div>
          ))}
        </div>
      ) : nextReward ? (
        <p className="text-xs text-muted-foreground">
          Chưa tới mốc. Còn streak {nextReward.count} (
          {formatStreakRewardLabel(nextReward)}).
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Không còn quà.</p>
      )}
    </div>
  );
};

export default MemberPhoneLookupCard;
