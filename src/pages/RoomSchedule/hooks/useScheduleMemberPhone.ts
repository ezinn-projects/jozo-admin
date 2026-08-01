import { ICreateRoomScheduleRequest } from "@/apis/roomSchedule.api";
import roomsScheduleApis from "@/apis/roomSchedule.api";
import membershipApis from "@/apis/membership.apis";
import { IStreakGiftsResponse } from "@/@types/Membership";
import { useGiftItemsByIds } from "@/hooks/use-gifts";
import { useServeStreakGift, useStreakGifts } from "@/hooks/use-membership";
import {
  collectSnacksGiftIds,
  mergeGiftItemsById,
  normalizeStreakGiftsResponse,
} from "@/pages/RoomSchedule/utils/streakGifts";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { isValidMemberPhone } from "../utils/memberPhone";

const EMPTY_AVAILABLE_GIFTS: never[] = [];
const EMPTY_STREAK_REWARDS: never[] = [];

interface UseScheduleMemberPhoneOptions {
  scheduleId: string;
  initialPhone?: string;
  initialGiftEnabled?: boolean;
  isOpen: boolean;
  refetchSchedules?: () => void;
  onGiftServed?: () => void;
}

export const useScheduleMemberPhone = ({
  scheduleId,
  initialPhone = "",
  initialGiftEnabled = false,
  isOpen,
  refetchSchedules,
  onGiftServed,
}: UseScheduleMemberPhoneOptions) => {
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState(initialPhone);
  const [savedPhone, setSavedPhone] = useState(initialPhone);
  const [isGiftEnabled, setIsGiftEnabled] = useState(initialGiftEnabled);

  useEffect(() => {
    if (!isOpen) return;
    setPhone(initialPhone);
    setSavedPhone(initialPhone);
  }, [isOpen, initialPhone]);

  useEffect(() => {
    if (!isOpen) return;
    setIsGiftEnabled(Boolean(initialGiftEnabled));
  }, [isOpen, initialGiftEnabled]);

  const isPhoneDirty = phone.trim() !== savedPhone.trim();
  const hasSavedValidPhone = isValidMemberPhone(savedPhone);
  const shouldLookupMember = isOpen && hasSavedValidPhone && !isPhoneDirty;

  const {
    data: streakGiftsData,
    isLoading: isLoadingMemberInfo,
    isError: isMemberInfoError,
    isFetched: hasFetchedMemberInfo,
  } = useStreakGifts(savedPhone, { enabled: shouldLookupMember });

  const memberInfo = streakGiftsData?.user ?? null;
  const availableGifts = streakGiftsData?.availableGifts ?? EMPTY_AVAILABLE_GIFTS;
  const streakRewards = streakGiftsData?.streakRewards ?? EMPTY_STREAK_REWARDS;
  const snacksGiftIds = useMemo(
    () => collectSnacksGiftIds(availableGifts, streakRewards),
    [availableGifts, streakRewards],
  );
  const fetchedGiftItemsById = useGiftItemsByIds(snacksGiftIds, {
    enabled: shouldLookupMember && !!memberInfo && snacksGiftIds.length > 0,
  });
  const giftItemsById = useMemo(
    () =>
      mergeGiftItemsById(availableGifts, streakRewards, fetchedGiftItemsById),
    [availableGifts, streakRewards, fetchedGiftItemsById],
  );
  const isMemberNotFound =
    shouldLookupMember &&
    hasFetchedMemberInfo &&
    !memberInfo &&
    !isMemberInfoError;

  const prefetchStreakGifts = useCallback(
    async (customerPhone: string) => {
      await queryClient.fetchQuery({
        queryKey: ["streak-gifts", customerPhone],
        queryFn: async () => {
          const response = await membershipApis.getStreakGifts(customerPhone);
          return normalizeStreakGiftsResponse(
            response.data.result as IStreakGiftsResponse | undefined,
          );
        },
        staleTime: 30 * 1000,
      });
    },
    [queryClient],
  );

  const { mutate: savePhoneMutation, isPending: isSavingPhone } = useMutation({
    mutationFn: (customerPhone: string) =>
      roomsScheduleApis.updateSchedule(scheduleId, {
        customerPhone,
      } as Partial<ICreateRoomScheduleRequest>),
    onSuccess: async (_, customerPhone) => {
      setSavedPhone(customerPhone);
      refetchSchedules?.();
      await prefetchStreakGifts(customerPhone);
      toast({
        title: "Đã lưu",
        description: "Số điện thoại thành viên đã được cập nhật",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật số điện thoại",
        variant: "destructive",
      });
    },
  });

  const { mutate: updateGiftEnabled, isPending: isUpdatingGiftEnabled } =
    useMutation({
      mutationFn: (giftEnabled: boolean) =>
        roomsScheduleApis.updateSchedule(scheduleId, { giftEnabled }),
      onMutate: async (giftEnabled) => {
        const previous = isGiftEnabled;
        setIsGiftEnabled(giftEnabled);
        return { previous };
      },
      onSuccess: (_, giftEnabled) => {
        refetchSchedules?.();
        toast({
          title: "Đã cập nhật",
          description: giftEnabled
            ? "Đã cho phép nhận quà"
            : "Đã tắt quyền nhận quà",
        });
      },
      onError: (_error, _giftEnabled, context) => {
        if (context?.previous !== undefined) {
          setIsGiftEnabled(context.previous);
        }
        toast({
          title: "Lỗi",
          description: "Không thể cập nhật quyền nhận quà",
          variant: "destructive",
        });
      },
    });

  const { mutate: serveStreakGiftMutation, isPending: isServingGift } =
    useServeStreakGift();

  const serveStreakGift = useCallback(
    (streakCount: number) => {
      const value = savedPhone.trim();
      if (!isValidMemberPhone(value)) {
        toast({
          title: "Số điện thoại không hợp lệ",
          description: "Vui lòng lưu SĐT hợp lệ trước khi phục vụ quà",
          variant: "destructive",
        });
        return;
      }
      serveStreakGiftMutation(
        { phone: value, streakCount, scheduleId },
        {
          onSuccess: () => {
            refetchSchedules?.();
            onGiftServed?.();
          },
        },
      );
    },
    [
      savedPhone,
      scheduleId,
      serveStreakGiftMutation,
      refetchSchedules,
      onGiftServed,
    ],
  );

  const savePhone = useCallback(() => {
    const value = phone.trim();
    if (!isValidMemberPhone(value)) {
      toast({
        title: "Số điện thoại không hợp lệ",
        description: "Vui lòng nhập đúng 10–11 số, bắt đầu bằng 0",
        variant: "destructive",
      });
      return;
    }
    savePhoneMutation(value);
  }, [phone, savePhoneMutation]);

  return {
    phone,
    setPhone,
    savedPhone,
    isGiftEnabled,
    updateGiftEnabled,
    isSavingPhone,
    isUpdatingGiftEnabled,
    isPhoneDirty,
    hasSavedValidPhone,
    savePhone,
    memberInfo,
    availableGifts,
    streakRewards,
    giftItemsById,
    isLoadingMemberInfo,
    isMemberInfoError,
    isMemberNotFound,
    serveStreakGift,
    isServingGift,
  };
};
