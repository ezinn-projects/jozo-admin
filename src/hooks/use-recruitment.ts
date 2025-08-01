import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recruitmentApis } from "@/apis/recruitment.apis";
import { toast } from "@/hooks/use-toast";

export const useRecruitments = (
  page: number = 1,
  limit: number = 10,
  search?: string
) => {
  return useQuery({
    queryKey: ["recruitments", page, limit, search],
    queryFn: () => recruitmentApis.getRecruitments(page, limit, search),
    select: (response) => response.data, // Trả về toàn bộ response để có pagination info
  });
};

export const useRecruitmentById = (id: string) => {
  return useQuery({
    queryKey: ["recruitment", id],
    queryFn: () => recruitmentApis.getRecruitmentById(id),
    enabled: !!id,
    select: (response) => response.data.data, // Lấy data từ response
  });
};

export const useRecruitmentStats = () => {
  return useQuery({
    queryKey: ["recruitment-stats"],
    queryFn: recruitmentApis.getStats,
    select: (response) => response.data.data, // Lấy data từ response
  });
};

export const useUpdateRecruitmentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      recruitmentApis.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruitments"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment-stats"] });
      toast({
        title: "Thành công",
        description: "Cập nhật trạng thái thành công",
      });
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : "Có lỗi xảy ra";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};
