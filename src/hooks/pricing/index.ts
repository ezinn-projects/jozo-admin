import pricingApis from "@/apis/pricing.apis";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetPricingLists = () => {
  return useQuery({
    queryKey: ["pricing"],
    queryFn: () => pricingApis.getPricingLists(),
  });
};

export const useAddPricing = () => {
  return useMutation({
    mutationFn: (payload: Omit<Pricing, "id">) =>
      pricingApis.addPricing(payload),
  });
};

export const useUpdatePricing = () => {
  return useMutation({
    mutationFn: (payload: Pricing) => pricingApis.updatePricing(payload),
  });
};

export const useDeletePricing = () => {
  return useMutation({
    mutationFn: (payload: { _id: string }) =>
      pricingApis.deletePricing(payload),
  });
};

export const useDeletePricingByIds = () => {
  return useMutation({
    mutationFn: (payload: { ids: string[] }) =>
      pricingApis.deletePricingByIds(payload),
  });
};
