import membershipApis from "@/apis/membership.apis";
import {
  GrantUserPointsPayload,
  IMembershipConfig,
  IPendingGiftsResponse,
  IUserStreakInfo,
  MembershipConfigPayload,
  UpdateStreakPayload,
} from "@/@types/Membership";
import { useToast } from "./use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useMembershipConfig = () => {
  return useQuery({
    queryKey: ["membership-config"],
    queryFn: async () => {
      const response = await membershipApis.getConfig();
      return response.data.result as IMembershipConfig | undefined;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

export const useUpdateMembershipConfig = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: MembershipConfigPayload) =>
      membershipApis.updateConfig(payload),
    onSuccess: (response) => {
      toast({
        title: "Thành công",
        description:
          response.data.message || "Đã lưu cấu hình membership thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["membership-config"] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể lưu cấu hình membership",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateMemberPoints = (userId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: GrantUserPointsPayload) => {
      if (!userId) {
        return Promise.reject(new Error("Thiếu userId để cập nhật điểm"));
      }
      return membershipApis.updateMemberPoints(userId, payload);
    },
    onSuccess: (response) => {
      toast({
        title: "Thành công",
        description:
          response.data.message || "Đã cập nhật điểm thành viên thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["user-membership", userId] });
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : "Không thể cập nhật điểm";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateMemberStreak = (userId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: UpdateStreakPayload) => {
      if (!userId) {
        return Promise.reject(new Error("Thiếu userId để cập nhật streak"));
      }
      return membershipApis.updateMemberStreak(userId, payload);
    },
    onSuccess: (response) => {
      toast({
        title: "Thành công",
        description:
          response.data.message || "Đã cập nhật streak thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["user-membership", userId] });
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : "Không thể cập nhật streak";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};

export const usePendingGifts = (phone?: string) => {
  return useQuery({
    queryKey: ["pending-gifts", phone],
    queryFn: async () => {
      if (!phone) {
        throw new Error("Thiếu số điện thoại");
      }
      const response = await membershipApis.getPendingGifts(phone);
      return response.data.result as IPendingGiftsResponse | undefined;
    },
    enabled: !!phone,
    staleTime: 30 * 1000, // 30 giây
    refetchOnWindowFocus: true,
  });
};

export const useMemberStreakInfo = (userId?: string) => {
  return useQuery({
    queryKey: ["member-streak-info", userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error("Thiếu userId");
      }
      const response = await membershipApis.getMemberStreakInfo(userId);
      return response.data.result as IUserStreakInfo | undefined;
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 giây
    refetchOnWindowFocus: true,
  });
};
