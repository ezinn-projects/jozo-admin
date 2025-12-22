import giftApis from "@/apis/gift.apis";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetAllGifts = () => {
  return useQuery({
    queryKey: ["gifts"],
    queryFn: async () => {
      const response = await giftApis.listGifts();
      return response.data.result || [];
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

export const useGetGiftById = (id: string) => {
  return useQuery({
    queryKey: ["gift", id],
    queryFn: () => giftApis.getGiftById(id),
    enabled: !!id,
  });
};

export const useCreateGift = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (formData: FormData) => giftApis.createGift(formData),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã tạo quà tặng mới thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["gifts"] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo quà tặng mới",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateGift = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      giftApis.updateGift(id, formData),
    onSuccess: (_, variables) => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật quà tặng thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["gifts"] });
      queryClient.invalidateQueries({ queryKey: ["gift", variables.id] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật quà tặng",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteGift = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => giftApis.deleteGift(id),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa quà tặng thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["gifts"] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa quà tặng",
        variant: "destructive",
      });
    },
  });
};
