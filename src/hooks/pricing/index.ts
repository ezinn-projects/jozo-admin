import { Price } from "@/@types/general-management";
import pricingApis from "@/apis/pricing.apis";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosResponse } from "axios";

export const useGetPricingLists = () => {
  return useQuery({
    queryKey: ["pricing"],
    queryFn: () => pricingApis.getPricingLists(),
  });
};

export const useAddPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pricingApis.createPricing,
    onSuccess: (data, payload) => {
      toast({
        title: "Pricing created successfully",
        description: "Pricing has been created successfully",
      });

      console.log("payload", payload);

      // queryClient.setQueryData(
      //   ["pricing"],
      //   (oldData: AxiosResponse<HTTPResponse<Price[]>>) => {
      //     if (!oldData.data.result) return oldData;

      //     const newPricing = {
      //       ...payload,
      //       _id: data?.data.result?._id,
      //       prices: payload.prices.map((price) => ({
      //         ...price,
      //         price: +price.price?.replace(/\./g, ""),
      //       })),
      //     };

      //     return {
      //       ...oldData,
      //       data: {
      //         ...oldData.data,
      //         result: [...oldData.data.result, newPricing],
      //       },
      //     };
      //   }
      // );
    },
  });
};

export const useGetPricingById = (id: string) => {
  return useQuery({
    queryKey: ["pricing", id],
    queryFn: () => pricingApis.getPricingById(id),
    enabled: !!id,
  });
};

export const useUpsertPricing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pricingApis.updatePricing,
    onSuccess: (data) => {
      toast({
        title: "Pricing updated successfully",
        description: "Pricing has been updated successfully",
      });

      queryClient.setQueryData(
        ["pricing"],
        (oldData: AxiosResponse<HTTPResponse<Price[]>>) => {
          return {
            ...oldData,
            data: {
              ...oldData.data,
              result: data.data.result,
            },
          };
        }
      );
    },
  });
};

export const useDeletePricing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { _id: string }) =>
      pricingApis.deletePricing(payload),
    onSuccess: (_, payload) => {
      toast({
        title: "Pricing deleted successfully",
        description: "Pricing has been deleted successfully",
      });

      queryClient.setQueryData(
        ["pricing"],
        (oldData: AxiosResponse<HTTPResponse<Price[]>>) => {
          if (!oldData.data.result) return oldData;
          return {
            ...oldData,
            data: {
              ...oldData.data,
              result: oldData.data.result.filter(
                (item) => item._id !== payload._id
              ),
            },
          };
        }
      );
    },
  });
};

export const useDeletePricingByIds = () => {
  return useMutation({
    mutationFn: (payload: { ids: string[] }) =>
      pricingApis.deletePricingByIds(payload),
  });
};
