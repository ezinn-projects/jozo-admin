import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  IAvailableStreakGift,
  IClaimGiftItem,
  ISelectableStreakGiftItem,
  IServedStreakGift,
  IStreakRewardProgress,
} from "@/@types/Membership";
import {
  Check,
  Gift,
  Loader2,
  Minus,
  Phone,
  Plus,
  Save,
  Search,
  User,
  Award,
  Star,
  Flame,
  Mail,
  Cake,
  Target,
  X,
} from "lucide-react";
import React, { memo, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  getMemberDisplayName,
  isValidMemberPhone,
  sanitizePhoneInput,
} from "../utils/memberPhone";
import {
  formatFnBCategory,
  getSelectableInStockItems,
  selectedItemsToPayload,
  sumSelectedItemQty,
} from "../utils/streakGifts";

export interface ScheduleGiftDetail {
  name?: string;
  status?: string;
  type?: string;
  discountPercentage?: number;
  items?: Array<{
    name?: string;
    quantity?: number;
    itemId?: string;
    category?: string;
  }>;
}

export interface ScheduleMemberInfo {
  full_name?: string | null;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  phone_number: string;
  date_of_birth?: string | null;
  tier?: string;
  availablePoint?: number;
  streakCount?: number;
}

interface ScheduleMemberSectionProps {
  phone: string;
  savedPhone?: string;
  onPhoneChange: (phone: string) => void;
  isPhoneDirty?: boolean;
  hasSavedValidPhone?: boolean;
  isSavingPhone?: boolean;
  onSavePhone?: () => void;
  onClearPhone?: () => void;
  isGiftEnabled?: boolean;
  onGiftEnabledChange?: (enabled: boolean) => void;
  isUpdatingGiftEnabled?: boolean;
  showGiftToggle?: boolean;
  hasClaimedGift?: boolean;
  giftDetail?: ScheduleGiftDetail | null;
  customerName?: string;
  customerEmail?: string;
  memberInfo?: ScheduleMemberInfo | null;
  isLoadingMemberInfo?: boolean;
  isMemberInfoError?: boolean;
  isMemberNotFound?: boolean;
  availableGifts?: IAvailableStreakGift[];
  streakRewards?: IStreakRewardProgress[];
  selectableItems?: ISelectableStreakGiftItem[];
  servedGifts?: IServedStreakGift[];
  /** Claim soft — items có thể [] / partial */
  onClaimGift?: (
    streakCount: number,
    items?: IClaimGiftItem[],
  ) => void | Promise<void>;
  /** Alias cũ của onClaimGift */
  onServeGift?: (
    streakCount: number,
    items: IClaimGiftItem[],
  ) => void | Promise<void>;
  onAddGiftItems?: (
    streakCount: number,
    items: IClaimGiftItem[],
  ) => void | Promise<void>;
  onUpdateGiftItemQty?: (
    streakCount: number,
    itemId: string,
    quantity: number,
  ) => void | Promise<void>;
  onRemoveGiftItem?: (
    streakCount: number,
    itemId: string,
  ) => void | Promise<void>;
  isServingGift?: boolean;
  className?: string;
  inputId?: string;
}

const getGiftStatusLabel = (
  hasClaimedGift: boolean,
  isGiftEnabled: boolean,
) => {
  if (hasClaimedGift) return "Đã nhận quà";
  if (isGiftEnabled) return "Được phép nhận quà";
  return "Chưa bật quà tặng";
};

const formatDateOfBirth = (date?: string | null) => {
  if (!date) return null;
  const parsed = dayjs(date);
  return parsed.isValid() ? parsed.format("DD/MM/YYYY") : null;
};

const getTierColor = (tier?: string) => {
  switch (tier?.toLowerCase()) {
    case "vip":
    case "diamond":
      return "text-purple-700 bg-purple-100 border-purple-200";
    case "gold":
      return "text-yellow-700 bg-yellow-100 border-yellow-200";
    case "silver":
      return "text-gray-700 bg-gray-100 border-gray-200";
    case "bronze":
      return "text-orange-700 bg-orange-100 border-orange-200";
    default:
      return "text-blue-700 bg-blue-100 border-blue-200";
  }
};

const getRewardLabel = (reward: IStreakRewardProgress) => {
  const parts: string[] = [];
  if (reward.itemCount && reward.itemCount > 0) {
    parts.push(`${reward.itemCount} món`);
  }
  if (reward.bonusPoints) {
    parts.push(`+${reward.bonusPoints} điểm`);
  }
  return parts.length > 0
    ? parts.join(", ")
    : `Streak ${reward.streakCount}`;
};

const formatAvailableGiftLabel = (gift: IAvailableStreakGift) => {
  const parts = [`${gift.itemCount} món`];
  if (gift.bonusPoints) parts.push(`+${gift.bonusPoints} điểm`);
  return parts.join(", ");
};

const ScheduleMemberSection: React.FC<ScheduleMemberSectionProps> = ({
  phone,
  savedPhone = "",
  onPhoneChange,
  isPhoneDirty = false,
  hasSavedValidPhone = false,
  isSavingPhone = false,
  onSavePhone,
  onClearPhone,
  isGiftEnabled = false,
  onGiftEnabledChange,
  isUpdatingGiftEnabled = false,
  showGiftToggle = true,
  hasClaimedGift = false,
  giftDetail,
  customerName,
  customerEmail,
  memberInfo,
  isLoadingMemberInfo = false,
  isMemberInfoError = false,
  isMemberNotFound = false,
  availableGifts = [],
  streakRewards = [],
  selectableItems = [],
  servedGifts = [],
  onClaimGift,
  onServeGift,
  onAddGiftItems,
  onUpdateGiftItemQty,
  onRemoveGiftItem,
  isServingGift = false,
  className,
  inputId = "schedule-member-phone",
}) => {
  const claimGift = onClaimGift ?? onServeGift;
  const [selectedStreakCount, setSelectedStreakCount] = useState<number | null>(
    null,
  );
  const [selectedItemQty, setSelectedItemQty] = useState<
    Record<string, number>
  >({});
  const [itemSearch, setItemSearch] = useState("");

  const servedGiftForSelected = useMemo(
    () =>
      servedGifts.find((gift) => gift.streakCount === selectedStreakCount) ??
      null,
    [servedGifts, selectedStreakCount],
  );

  // Bỏ chọn mốc đã claim mà không còn served trên schedule này
  useEffect(() => {
    if (selectedStreakCount === null) return;
    const reward = streakRewards.find(
      (r) => r.streakCount === selectedStreakCount,
    );
    if (!reward) return;
    const isClaimed = reward.claimed || reward.isClaimed === true;
    const served = servedGifts.some(
      (g) => g.streakCount === selectedStreakCount,
    );
    if (isClaimed && !served) {
      setSelectedStreakCount(null);
      setSelectedItemQty({});
      setItemSearch("");
    }
  }, [selectedStreakCount, streakRewards, servedGifts]);

  const selectedMilestone = useMemo((): IAvailableStreakGift | null => {
    if (selectedStreakCount === null) return null;
    if (servedGiftForSelected) {
      return {
        streakCount: servedGiftForSelected.streakCount,
        itemCount: servedGiftForSelected.itemCount,
        usedQuantity: servedGiftForSelected.usedQuantity,
        remainingQuantity: servedGiftForSelected.remainingQuantity,
        bonusPoints: servedGiftForSelected.bonusPoints,
      };
    }
    const fromAvailable = availableGifts.find(
      (gift) => gift.streakCount === selectedStreakCount,
    );
    if (fromAvailable) return fromAvailable;

    const fromReward = streakRewards.find(
      (reward) => reward.streakCount === selectedStreakCount,
    );
    if (!fromReward) return null;

    return {
      streakCount: fromReward.streakCount,
      itemCount: fromReward.itemCount ?? 0,
      usedQuantity: fromReward.usedQuantity,
      remainingQuantity: fromReward.remainingQuantity,
      bonusPoints: fromReward.bonusPoints,
    };
  }, [
    availableGifts,
    selectedStreakCount,
    servedGiftForSelected,
    streakRewards,
  ]);

  const quotaMax = selectedMilestone?.itemCount ?? 0;
  const remainingQuota = servedGiftForSelected
    ? servedGiftForSelected.remainingQuantity
    : Math.max(0, quotaMax - sumSelectedItemQty(selectedItemQty));
  const inStockItems = useMemo(
    () => getSelectableInStockItems(selectableItems),
    [selectableItems],
  );
  const filteredInStockItems = useMemo(() => {
    const keyword = itemSearch.trim().toLowerCase();
    if (!keyword) return inStockItems;
    return inStockItems.filter((item) => {
      const name = item.name?.toLowerCase() ?? "";
      const category = item.category?.toLowerCase() ?? "";
      const categoryLabel =
        formatFnBCategory(item.category)?.toLowerCase() ?? "";
      return (
        name.includes(keyword) ||
        category.includes(keyword) ||
        categoryLabel.includes(keyword)
      );
    });
  }, [inStockItems, itemSearch]);
  const selectedQtyTotal = sumSelectedItemQty(selectedItemQty);
  // Claim soft: không bắt buộc chọn đủ quota
  const canClaimGift = selectedMilestone !== null && !servedGiftForSelected;

  const isPhoneValid = isValidMemberPhone(phone);
  const showPhoneError = phone.length > 0 && !isPhoneValid;
  const canClearPhone =
    Boolean(onClearPhone) &&
    (phone.trim().length > 0 || savedPhone.trim().length > 0);
  const isActive = hasClaimedGift || (showGiftToggle && isGiftEnabled);
  /** Hiện card member/quà ngay khi SĐT trên input hợp lệ (auto-lookup). */
  const showMemberLookup =
    isPhoneValid &&
    (isLoadingMemberInfo ||
      memberInfo ||
      isMemberInfoError ||
      isMemberNotFound);
  const showScheduleCustomer =
    (customerName || customerEmail) && !memberInfo && !isLoadingMemberInfo;

  const handlePhoneChange = (value: string) => {
    onPhoneChange(sanitizePhoneInput(value));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isPhoneDirty && isPhoneValid && onSavePhone) {
      e.preventDefault();
      onSavePhone();
    }
  };

  const handleSelectMilestone = (streakCount: number) => {
    setSelectedStreakCount((prev) => {
      if (prev === streakCount) {
        setSelectedItemQty({});
        setItemSearch("");
        return null;
      }
      setSelectedItemQty({});
      setItemSearch("");
      return streakCount;
    });
  };

  const adjustDraftItemQty = (
    item: ISelectableStreakGiftItem,
    delta: number,
  ) => {
    setSelectedItemQty((prev) => {
      const current = prev[item.itemId] ?? 0;
      const nextQty = current + delta;
      if (nextQty <= 0) {
        const next = { ...prev };
        delete next[item.itemId];
        return next;
      }
      const otherTotal = sumSelectedItemQty(prev) - current;
      if (quotaMax > 0 && otherTotal + nextQty > quotaMax) return prev;
      if (nextQty > item.quantity) return prev;
      return { ...prev, [item.itemId]: nextQty };
    });
  };

  const handleClaimGift = () => {
    if (!canClaimGift || selectedStreakCount === null || !claimGift) return;
    void claimGift(
      selectedStreakCount,
      selectedItemsToPayload(selectedItemQty),
    );
    setSelectedItemQty({});
  };

  const handleAddOneItem = (itemId: string) => {
    if (!selectedStreakCount || !onAddGiftItems) return;
    if (remainingQuota <= 0) return;
    void onAddGiftItems(selectedStreakCount, [{ itemId, quantity: 1 }]);
  };

  const handleChangeServedQty = (itemId: string, nextQty: number) => {
    if (!selectedStreakCount) return;
    if (nextQty <= 0) {
      if (onRemoveGiftItem) {
        void onRemoveGiftItem(selectedStreakCount, itemId);
      } else if (onUpdateGiftItemQty) {
        void onUpdateGiftItemQty(selectedStreakCount, itemId, 0);
      }
      return;
    }
    onUpdateGiftItemQty?.(selectedStreakCount, itemId, nextQty);
  };

  return (
    <section
      className={cn(
        "rounded-xl border p-4 space-y-4",
        isActive
          ? "border-pink-200 bg-gradient-to-br from-blue-50 via-white to-pink-50"
          : "border-blue-200 bg-blue-50/60",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Phone className="w-4 h-4 text-blue-600" />
            {showGiftToggle ? "Thành viên & quà tặng" : "Thành viên"}
          </h3>
        </div>
        {showGiftToggle && (
          <Badge
            variant="outline"
            className={cn(
              "shrink-0",
              hasClaimedGift
                ? "border-pink-300 text-pink-700 bg-pink-50"
                : isGiftEnabled
                  ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                  : "border-gray-300 text-gray-600 bg-white",
            )}
          >
            {getGiftStatusLabel(hasClaimedGift, isGiftEnabled)}
          </Badge>
        )}
        {!showGiftToggle && hasClaimedGift && (
          <Badge
            variant="outline"
            className="shrink-0 border-pink-300 text-pink-700 bg-pink-50"
          >
            Đã nhận quà
          </Badge>
        )}
      </div>

      {showMemberLookup && isLoadingMemberInfo && (
        <div className="rounded-lg border border-blue-100 bg-white/80 px-3 py-2.5 flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span>Đang tìm member...</span>
        </div>
      )}

      {showMemberLookup && !isLoadingMemberInfo && memberInfo && (
        <div className="rounded-lg border border-blue-100 bg-white/90 px-3 py-3 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {getMemberDisplayName(memberInfo)}
                </p>
                {memberInfo.name && memberInfo.username && (
                  <p className="text-xs text-gray-500 truncate">
                    @{memberInfo.username}
                  </p>
                )}
              </div>
            </div>
            {memberInfo.tier && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0",
                  getTierColor(memberInfo.tier),
                )}
              >
                <Award className="w-3 h-3" />
                {memberInfo.tier.toUpperCase()}
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-gray-700 min-w-0">
              <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="text-gray-500 w-20 shrink-0">Tên</span>
              <span className="font-medium truncate">
                {memberInfo.full_name?.trim() || memberInfo.name?.trim() || "—"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="text-gray-500 w-20 shrink-0">SĐT</span>
              <span className="font-medium">{memberInfo.phone_number}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 min-w-0">
              <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="text-gray-500 w-20 shrink-0">Email</span>
              <span className="font-medium truncate">
                {memberInfo.email?.trim() || "—"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Cake className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="text-gray-500 w-20 shrink-0">Ngày sinh</span>
              <span className="font-medium">
                {formatDateOfBirth(memberInfo.date_of_birth) || "—"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md bg-yellow-50 border border-yellow-100 px-2.5 py-2">
              <div className="flex items-center gap-1 text-xs text-gray-600 mb-0.5">
                <Star className="w-3 h-3 text-yellow-600" />
                Điểm
              </div>
              <p className="text-base font-bold text-yellow-700">
                {(memberInfo.availablePoint ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-md bg-orange-50 border border-orange-100 px-2.5 py-2">
              <div className="flex items-center gap-1 text-xs text-gray-600 mb-0.5">
                <Flame className="w-3 h-3 text-orange-600" />
                Streak
              </div>
              <p className="text-base font-bold text-orange-700">
                {memberInfo.streakCount ?? 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {showMemberLookup &&
        !isLoadingMemberInfo &&
        !memberInfo &&
        (isMemberInfoError || isMemberNotFound) && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-800">
            Không tìm thấy tài khoản thành viên với SĐT này.
          </div>
        )}

      {showScheduleCustomer && (
        <div className="rounded-lg border border-blue-100 bg-white/80 px-3 py-2 text-sm space-y-1">
          {customerName && (
            <div className="flex items-center gap-2 text-gray-700">
              <User className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-medium">{customerName}</span>
            </div>
          )}
          {customerEmail && (
            <p className="text-xs text-gray-500 pl-5">{customerEmail}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={inputId} className="text-sm font-medium">
          Số điện thoại thành viên
        </Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex-1 space-y-1">
            <div className="relative">
              <Input
                id={inputId}
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="VD: 0912345678"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSavingPhone}
                className={cn(
                  "h-11 text-base sm:text-lg tracking-wide",
                  canClearPhone && "pr-10",
                  showPhoneError && "border-red-500 focus-visible:ring-red-500",
                )}
              />
              {canClearPhone && (
                <button
                  type="button"
                  onClick={onClearPhone}
                  disabled={isSavingPhone}
                  aria-label="Bỏ thành viên"
                  title="Bỏ thành viên"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {showPhoneError ? (
              <p className="text-xs text-red-600">
                SĐT không hợp lệ (10–11 số, bắt đầu bằng 0)
              </p>
            ) : isPhoneValid && isLoadingMemberInfo ? (
              <p className="text-xs text-muted-foreground">Đang tìm...</p>
            ) : hasSavedValidPhone && !isPhoneDirty ? (
              <p className="text-xs text-muted-foreground">Đã lưu: {savedPhone}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Nhập SĐT để xem member và quà
              </p>
            )}
          </div>
          {isPhoneDirty && onSavePhone && (
            <Button
              type="button"
              onClick={onSavePhone}
              disabled={!isPhoneValid || isSavingPhone}
              className="h-11 sm:min-w-[110px] bg-blue-600 hover:bg-blue-700"
            >
              {isSavingPhone ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  Lưu SĐT
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {showGiftToggle && onGiftEnabledChange && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white/90 px-3 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <Gift
              className={cn(
                "w-4 h-4 shrink-0",
                isGiftEnabled ? "text-pink-500" : "text-gray-400",
              )}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800">
                Cho phép nhận quà
              </p>
              <p className="text-xs text-gray-500 truncate">
                Bật khi khách đủ điều kiện nhận quà trong phiên
              </p>
            </div>
          </div>
          <Switch
            checked={isGiftEnabled}
            onCheckedChange={(checked) => onGiftEnabledChange(checked === true)}
            disabled={isUpdatingGiftEnabled}
          />
        </div>
      )}

      {giftDetail && (
        <div className="rounded-lg border border-pink-200 bg-pink-50/80 px-3 py-2.5 space-y-1.5 text-sm">
          <p className="font-medium text-pink-800">
            Quà đã gán: {giftDetail.name || "Quà tặng"}
          </p>
          {giftDetail.status && (
            <p className="text-xs text-gray-600">
              Trạng thái: {giftDetail.status}
            </p>
          )}
          {giftDetail.type === "discount" && giftDetail.discountPercentage && (
            <p className="text-green-700 font-semibold">
              Giảm {giftDetail.discountPercentage}%
            </p>
          )}
          {giftDetail.type === "snacks_drinks" &&
            giftDetail.items &&
            giftDetail.items.length > 0 && (
              <ul className="list-disc pl-4 space-y-0.5 text-xs text-gray-700">
                {giftDetail.items.map((item, index) => (
                  <li key={item.itemId || index}>
                    {item.name || "Món"}
                    {item.quantity !== undefined && ` ×${item.quantity}`}
                  </li>
                ))}
              </ul>
            )}
        </div>
      )}

      {showMemberLookup && !isLoadingMemberInfo && memberInfo && (
        <>
          {availableGifts.length > 0 && (
            <div className="rounded-lg border border-pink-200 bg-pink-50/60 px-3 py-3 space-y-2.5">
              <p className="text-sm font-semibold text-pink-900 flex items-center gap-2">
                <Gift className="w-4 h-4 text-pink-600" />
                Quà ({availableGifts.length})
              </p>
              <div className="space-y-2">
                {availableGifts.map((gift) => {
                  const isSelected = selectedStreakCount === gift.streakCount;
                  return (
                    <button
                      key={gift.streakCount}
                      type="button"
                      onClick={() => handleSelectMilestone(gift.streakCount)}
                      disabled={isServingGift}
                      className={cn(
                        "w-full text-left rounded-md border px-2.5 py-2.5 transition-colors",
                        isSelected
                          ? "border-pink-400 bg-pink-100 ring-1 ring-pink-300"
                          : "border-pink-200 bg-white hover:bg-pink-50",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">
                            Streak {gift.streakCount}
                          </p>
                          <p className="text-xs text-gray-600">
                            {formatAvailableGiftLabel(gift)}
                          </p>
                        </div>
                        {isSelected && (
                          <Badge
                            variant="outline"
                            className="shrink-0 border-pink-300 text-pink-700 bg-pink-50"
                          >
                            Đang chọn
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {streakRewards.length > 0 && (
            <div className="rounded-lg border border-orange-100 bg-white/90 px-3 py-3 space-y-2.5">
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-600" />
                Tiến độ streak
              </p>
              <div className="space-y-2">
                {streakRewards.map((reward) => {
                  const served = servedGifts.find(
                    (gift) => gift.streakCount === reward.streakCount,
                  );
                  const isClaimed = reward.claimed || reward.isClaimed === true;
                  // Đã claim: chỉ mở được nếu schedule này còn servedGifts (để sửa món/quota)
                  const isDisabled = isServingGift || (isClaimed && !served);
                  const isSelected =
                    selectedStreakCount === reward.streakCount && !isDisabled;

                  if (isClaimed && !served) {
                    return (
                      <div
                        key={reward.streakCount}
                        className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-2 text-sm text-gray-500 opacity-80"
                        aria-disabled
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold bg-emerald-100 text-emerald-700">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {getRewardLabel(reward)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Streak {reward.streakCount} · Đã nhận
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="shrink-0 border-emerald-200 text-emerald-700 bg-emerald-50"
                          >
                            Đã nhận
                          </Badge>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={reward.streakCount}
                      type="button"
                      onClick={() => handleSelectMilestone(reward.streakCount)}
                      disabled={isDisabled}
                      className={cn(
                        "w-full text-left rounded-md border px-2.5 py-2 text-sm transition-colors",
                        isDisabled && "cursor-not-allowed opacity-60",
                        isSelected
                          ? "border-pink-400 bg-pink-100 ring-1 ring-pink-300 text-pink-950"
                          : served
                            ? "border-emerald-200 bg-emerald-50/80 text-emerald-950 hover:bg-emerald-100"
                            : "border-pink-200 bg-pink-50/80 text-pink-950 hover:bg-pink-100",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
                            served
                              ? "bg-emerald-200 text-emerald-800"
                              : "bg-pink-200 text-pink-800",
                          )}
                        >
                          {served ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            reward.streakCount
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {getRewardLabel(reward)}
                          </p>
                          <p className="text-xs opacity-80">
                            Streak {reward.streakCount}
                            {served
                              ? ` • ${served.usedQuantity}/${served.itemCount} món`
                              : reward.isReached
                                ? " • Chọn để nhận"
                                : ""}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0",
                            isSelected
                              ? "border-pink-400 text-pink-800 bg-pink-50"
                              : served
                                ? "border-emerald-300 text-emerald-700 bg-white"
                                : "border-pink-300 text-pink-700 bg-white",
                          )}
                        >
                          {isSelected
                            ? "Đang chọn"
                            : served
                              ? "Sửa món"
                              : "Nhận"}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedMilestone && (
            <div className="rounded-md border border-pink-200 bg-white px-2.5 py-2.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {servedGiftForSelected
                    ? `Quà đã phát — streak ${selectedMilestone.streakCount}`
                    : `Nhận quà — streak ${selectedMilestone.streakCount}`}
                </p>
                <p className="text-xs font-semibold text-pink-700">
                  {servedGiftForSelected
                    ? `${servedGiftForSelected.usedQuantity}/${servedGiftForSelected.itemCount}`
                    : quotaMax > 0
                      ? `${selectedQtyTotal}/${quotaMax} món`
                      : null}
                </p>
              </div>

              {servedGiftForSelected && (
                <ul className="space-y-1.5">
                  {servedGiftForSelected.items.length === 0 ? (
                    <li className="text-xs text-gray-500">
                      Chưa có món — chọn bên dưới để thêm.
                    </li>
                  ) : (
                    servedGiftForSelected.items.map((item) => {
                      const categoryLabel = formatFnBCategory(item.category);
                      const canIncrease = remainingQuota > 0;
                      return (
                        <li
                          key={item.itemId}
                          className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50/60 px-2 py-1.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-gray-900 truncate">
                              {item.name || "Món"}
                            </p>
                            <p className="text-[11px] text-gray-500">
                              {categoryLabel ?? item.category ?? "—"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              disabled={isServingGift}
                              onClick={() =>
                                handleChangeServedQty(
                                  item.itemId,
                                  item.quantity - 1,
                                )
                              }
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </Button>
                            <span className="w-5 text-center text-xs font-semibold">
                              {item.quantity}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              disabled={!canIncrease || isServingGift}
                              onClick={() =>
                                handleChangeServedQty(
                                  item.itemId,
                                  item.quantity + 1,
                                )
                              }
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-600"
                              disabled={isServingGift}
                              onClick={() =>
                                onRemoveGiftItem?.(
                                  selectedMilestone.streakCount,
                                  item.itemId,
                                )
                              }
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </li>
                      );
                    })
                  )}
                </ul>
              )}

              {/* Claim draft picker OR add-more when remaining > 0 */}
              {((!servedGiftForSelected && quotaMax >= 0) ||
                (servedGiftForSelected && remainingQuota > 0)) &&
                (inStockItems.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    Không còn món trong kho để chọn.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                      <Input
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                        placeholder="Tìm món (tên, loại)..."
                        className="h-8 pl-8 pr-8 text-xs"
                        disabled={isServingGift}
                      />
                      {itemSearch && (
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setItemSearch("")}
                          aria-label="Xóa tìm kiếm"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {filteredInStockItems.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-2">
                        Không tìm thấy món phù hợp.
                      </p>
                    ) : (
                      <ul className="space-y-1.5 max-h-56 overflow-y-auto">
                        {filteredInStockItems.map((item) => {
                          const qty = selectedItemQty[item.itemId] ?? 0;
                          const categoryLabel = formatFnBCategory(
                            item.category,
                          );
                          const alreadyServed =
                            servedGiftForSelected?.items.some(
                              (served) => served.itemId === item.itemId,
                            );

                          if (servedGiftForSelected) {
                            return (
                              <li
                                key={item.itemId}
                                className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1.5"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium truncate">
                                    {item.name}
                                  </p>
                                  <p className="text-[11px] text-gray-500">
                                    {categoryLabel ?? item.category}
                                    {" • Kho: "}
                                    {item.quantity}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-7"
                                  disabled={
                                    isServingGift ||
                                    remainingQuota <= 0 ||
                                    item.quantity <= 0
                                  }
                                  onClick={() => handleAddOneItem(item.itemId)}
                                >
                                  <Plus className="h-3.5 w-3.5 mr-1" />
                                  {alreadyServed ? "Thêm 1" : "Thêm"}
                                </Button>
                              </li>
                            );
                          }

                          const canIncrease =
                            (quotaMax === 0 || selectedQtyTotal < quotaMax) &&
                            qty < item.quantity;

                          return (
                            <li
                              key={item.itemId}
                              className={cn(
                                "flex items-center gap-2 rounded-md border px-2 py-1.5",
                                qty > 0
                                  ? "border-pink-300 bg-pink-50"
                                  : "border-gray-200 bg-white",
                              )}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium truncate">
                                  {item.name}
                                </p>
                                <p className="text-[11px] text-gray-500">
                                  {categoryLabel ?? item.category}
                                  {" • Kho: "}
                                  {item.quantity}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  disabled={qty <= 0 || isServingGift}
                                  onClick={() => adjustDraftItemQty(item, -1)}
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </Button>
                                <span className="w-5 text-center text-xs font-semibold">
                                  {qty}
                                </span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  disabled={!canIncrease || isServingGift}
                                  onClick={() => adjustDraftItemQty(item, 1)}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ))}

              {!servedGiftForSelected && claimGift && (
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    onClick={handleClaimGift}
                    disabled={!canClaimGift || isServingGift}
                    className="w-full bg-pink-600 hover:bg-pink-700"
                  >
                    {isServingGift ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang phát...
                      </>
                    ) : (
                      <>
                        <Gift className="w-4 h-4 mr-2" />
                        {selectedQtyTotal > 0
                          ? `Phát quà (${selectedQtyTotal} món)`
                          : "Phát quà"}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {streakRewards.length === 0 &&
            availableGifts.length === 0 &&
            servedGifts.length === 0 && (
              <div className="rounded-lg border border-gray-200 bg-white/80 px-3 py-2.5 text-sm text-gray-600 text-center">
                Không có quà streak cần phục vụ lúc này.
              </div>
            )}
        </>
      )}
    </section>
  );
};

export default memo(ScheduleMemberSection);
