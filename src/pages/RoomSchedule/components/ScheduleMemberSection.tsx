import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { GiftBundleItem } from "@/@types/Gift";
import {
  IAvailableStreakGift,
  IStreakRewardProgress,
} from "@/@types/Membership";
import {
  Check,
  Gift,
  Loader2,
  Phone,
  Save,
  User,
  Award,
  Star,
  Flame,
  Mail,
  Cake,
  Target,
} from "lucide-react";
import React, { memo, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  getMemberDisplayName,
  isValidMemberPhone,
  sanitizePhoneInput,
} from "../utils/memberPhone";
import { formatFnBCategory } from "../utils/streakGifts";

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
  giftItemsById?: Record<string, GiftBundleItem[]>;
  onServeGift?: (streakCount: number) => void;
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

const formatGiftType = (type?: string) => {
  if (type === "snacks_drinks") return "Đồ ăn/Nước";
  if (type === "discount") return "Giảm giá";
  return type || "Quà tặng";
};

const getRewardLabel = (reward: IStreakRewardProgress) => {
  if (reward.giftName) return reward.giftName;
  if (reward.bonusPoints) return `+${reward.bonusPoints} điểm`;
  return `Mốc streak ${reward.streakCount}`;
};

const GiftBundleItemsList = memo(function GiftBundleItemsList({
  items,
  variant = "available",
}: {
  items: GiftBundleItem[];
  variant?: "available" | "progress";
}) {
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "mt-2 rounded-md border px-2 py-2 space-y-1.5",
        variant === "available"
          ? "border-pink-200 bg-white/90"
          : "border-orange-100 bg-white/80",
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        Cần chuẩn bị
      </p>
      <ul className="space-y-1">
        {items.map((item) => {
          const categoryLabel = formatFnBCategory(item.category);
          return (
            <li
              key={item.itemId}
              className="flex items-start justify-between gap-2 text-xs text-gray-800"
            >
              <div className="min-w-0">
                <span className="font-medium">{item.name}</span>
                {categoryLabel && (
                  <span className="text-gray-500"> • {categoryLabel}</span>
                )}
              </div>
              <span className="shrink-0 font-semibold text-pink-700">
                ×{item.quantity}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
});

const ScheduleMemberSection: React.FC<ScheduleMemberSectionProps> = ({
  phone,
  savedPhone = "",
  onPhoneChange,
  isPhoneDirty = false,
  hasSavedValidPhone = false,
  isSavingPhone = false,
  onSavePhone,
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
  giftItemsById = {},
  onServeGift,
  isServingGift = false,
  className,
  inputId = "schedule-member-phone",
}) => {
  const [selectedStreakCount, setSelectedStreakCount] = useState<number | null>(
    null,
  );
  const availableGiftIds = useMemo(
    () => new Set(availableGifts.map((gift) => gift.giftId).filter(Boolean)),
    [availableGifts],
  );

  const isPhoneValid = isValidMemberPhone(phone);
  const showPhoneError = phone.length > 0 && !isPhoneValid;
  const isActive = hasClaimedGift || (showGiftToggle && isGiftEnabled);
  const showMemberLookup =
    hasSavedValidPhone &&
    !isPhoneDirty &&
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

  const handleServeGift = () => {
    if (selectedStreakCount === null || !onServeGift) return;
    onServeGift(selectedStreakCount);
    setSelectedStreakCount(null);
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
          <span>Đang tra cứu thông tin thành viên...</span>
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
                showPhoneError && "border-red-500 focus-visible:ring-red-500",
              )}
            />
            {showPhoneError ? (
              <p className="text-xs text-red-600">
                Số điện thoại không hợp lệ (10–11 số, bắt đầu bằng 0)
              </p>
            ) : isPhoneDirty ? (
              <p className="text-xs text-amber-600">
                Bấm Lưu SĐT để lưu và tra cứu thông tin thành viên
              </p>
            ) : hasSavedValidPhone ? (
              <p className="text-xs text-emerald-600">Đã lưu: {savedPhone}</p>
            ) : (
              <p className="text-xs text-gray-500">
                Nhấn Enter hoặc bấm Lưu sau khi nhập xong
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
                Quà cần chuẩn bị ({availableGifts.length})
              </p>
              <div className="space-y-2">
                {availableGifts.map((gift) => {
                  const isSelected = selectedStreakCount === gift.streakCount;
                  const bundleItems =
                    gift.giftType === "snacks_drinks"
                      ? (giftItemsById[gift.giftId] ?? [])
                      : [];

                  return (
                    <button
                      key={`${gift.giftId}-${gift.streakCount}`}
                      type="button"
                      onClick={() =>
                        setSelectedStreakCount(
                          isSelected ? null : gift.streakCount,
                        )
                      }
                      disabled={isServingGift}
                      className={cn(
                        "w-full text-left rounded-md border px-2.5 py-2.5 transition-colors",
                        isSelected
                          ? "border-pink-400 bg-pink-100 ring-1 ring-pink-300"
                          : "border-pink-200 bg-white hover:bg-pink-50",
                      )}
                    >
                      <div className="flex gap-3">
                        {gift.giftImage && (
                          <img
                            src={gift.giftImage}
                            alt={gift.giftName}
                            className="w-12 h-12 rounded-md object-cover shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {gift.giftName}
                          </p>
                          <p className="text-xs text-gray-600">
                            {formatGiftType(gift.giftType)} • Streak{" "}
                            {gift.streakCount}
                          </p>
                          {gift.bonusPoints ? (
                            <p className="text-xs text-emerald-600 font-medium mt-0.5">
                              Thưởng: +{gift.bonusPoints} điểm
                            </p>
                          ) : null}
                        </div>
                      </div>
                      {bundleItems.length > 0 && (
                        <GiftBundleItemsList items={bundleItems} />
                      )}
                    </button>
                  );
                })}
              </div>
              {onServeGift && (
                <Button
                  type="button"
                  onClick={handleServeGift}
                  disabled={selectedStreakCount === null || isServingGift}
                  className="w-full bg-pink-600 hover:bg-pink-700"
                >
                  {isServingGift ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang phục vụ...
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      Đã đưa quà
                    </>
                  )}
                </Button>
              )}
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
                  const bundleItems =
                    reward.giftType === "snacks_drinks" &&
                    reward.giftId &&
                    !availableGiftIds.has(reward.giftId)
                      ? (giftItemsById[reward.giftId] ?? [])
                      : [];

                  return (
                    <div
                      key={reward.streakCount}
                      className={cn(
                        "rounded-md border px-2.5 py-2 text-sm",
                        reward.claimed
                          ? "border-gray-200 bg-gray-50 text-gray-500"
                          : reward.isNext
                            ? "border-orange-300 bg-orange-50 text-orange-900"
                            : "border-gray-200 bg-white text-gray-700",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
                            reward.claimed
                              ? "bg-emerald-100 text-emerald-700"
                              : reward.isNext
                                ? "bg-orange-200 text-orange-800"
                                : "bg-gray-100 text-gray-500",
                          )}
                        >
                          {reward.claimed ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            reward.streakCount
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {getRewardLabel(reward)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Streak {reward.streakCount}
                            {reward.giftType &&
                              ` • ${formatGiftType(reward.giftType)}`}
                          </p>
                        </div>
                        {reward.claimed ? (
                          <Badge
                            variant="outline"
                            className="shrink-0 border-emerald-200 text-emerald-700 bg-emerald-50"
                          >
                            Đã nhận
                          </Badge>
                        ) : reward.isNext ? (
                          <Badge
                            variant="outline"
                            className="shrink-0 border-orange-300 text-orange-700 bg-orange-100"
                          >
                            Mốc tiếp
                          </Badge>
                        ) : null}
                      </div>
                      {bundleItems.length > 0 && (
                        <GiftBundleItemsList
                          items={bundleItems}
                          variant="progress"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {streakRewards.length === 0 && availableGifts.length === 0 && (
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
