import promotionApis, {
  Promotion,
  PromotionPayload,
} from "@/apis/promotion.apis";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetPromotions = () => {
  return useQuery({
    queryKey: ["promotions"],
    queryFn: promotionApis.getAllPromotions,
  });
};

export const useGetActivePromotion = () => {
  return useQuery({
    queryKey: ["activePromotion"],
    queryFn: promotionApis.getActivePromotion,
  });
};

export const useGetPromotionById = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ["promotion", id],
    queryFn: () => promotionApis.getPromotionById(id),
    enabled,
  });
};

export const useCreatePromotion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PromotionPayload) =>
      promotionApis.createPromotion(payload),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Promotion created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create promotion",
        variant: "destructive",
      });
      console.error(error);
    },
  });
};

export const useUpdatePromotion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PromotionPayload) =>
      promotionApis.updatePromotion(payload),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Promotion updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update promotion",
        variant: "destructive",
      });
      console.error(error);
    },
  });
};

export const useDeletePromotion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { _id: string }) =>
      promotionApis.deletePromotion(payload),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Promotion deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete promotion",
        variant: "destructive",
      });
      console.error(error);
    },
  });
};
