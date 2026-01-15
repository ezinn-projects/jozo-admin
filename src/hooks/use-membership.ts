import membershipApis from "@/apis/membership.apis";
import {
  GrantUserPointsPayload,
  IMembershipConfig,
  MembershipConfigPayload,
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
