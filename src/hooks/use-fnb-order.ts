import { useMutation, useQueryClient } from "@tanstack/react-query";
import fnbOrderApis, { IAddRemoveItemRequestBody } from "@/apis/fnbOrder.apis";
import { toast } from "@/hooks/use-toast";

export const useAddItemToOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roomScheduleId,
      itemId,
      quantity,
      category,
      createdBy,
    }: {
      roomScheduleId: string;
      itemId: string;
      quantity: number;
      category: "drinks" | "snacks";
      createdBy: string;
    }) => {
      const payload: IAddRemoveItemRequestBody = {
        order: {
          ...(category === "drinks"
            ? { drinks: { [itemId]: quantity } }
            : { snacks: { [itemId]: quantity } }),
        },
        createdBy,
      };
      return fnbOrderApis.addItemToOrder(roomScheduleId, payload);
    },
    onSuccess: (_data, variables) => {
      // Invalidate và refetch FNB order data
      queryClient.invalidateQueries({
        queryKey: ["fnbOrderByScheduleId", variables.roomScheduleId],
      });

      toast({
        title: "Thành công",
        description: "Đã thêm món vào đơn hàng",
      });
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không thể thêm món vào đơn hàng";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};

export const useRemoveItemFromOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roomScheduleId,
      itemId,
      quantity,
      category,
      createdBy,
    }: {
      roomScheduleId: string;
      itemId: string;
      quantity: number;
      category: "drinks" | "snacks";
      createdBy: string;
    }) => {
      const payload: IAddRemoveItemRequestBody = {
        order: {
          ...(category === "drinks"
            ? { drinks: { [itemId]: quantity } }
            : { snacks: { [itemId]: quantity } }),
        },
        createdBy,
      };
      return fnbOrderApis.removeItemFromOrder(roomScheduleId, payload);
    },
    onSuccess: (_data, variables) => {
      // Invalidate và refetch FNB order data
      queryClient.invalidateQueries({
        queryKey: ["fnbOrderByScheduleId", variables.roomScheduleId],
      });

      toast({
        title: "Thành công",
        description: "Đã cập nhật số lượng món",
      });
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không thể cập nhật số lượng món";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};
