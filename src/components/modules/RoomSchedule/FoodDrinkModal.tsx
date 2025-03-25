import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import fnbOrderApis from "@/apis/fnbOrder.apis";
import { toast } from "@/hooks/use-toast";
import { IFnbOrder } from "@/@types/FnbOrder";
import { AxiosResponse } from "axios";
import { useEffect } from "react";
import useAuth from "@/hooks/useAuth";
import { DRINK_OPTIONS, SNACK_OPTIONS } from "@/constants/options";

interface FoodDrinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleId: string;
  refetch: VoidFunction;
}

// // Danh sách đồ uống
// const drinks = [
//   { id: "water", name: "Nước", price: 10000 },
//   { id: "soda", name: "Nước ngọt", price: 15000 },
//   { id: "tea", name: "Nước trà", price: 15000 },
// ];

// // Danh sách snack
// const snacks = [
//   { id: "regular", name: "Snack thường", price: 10000 },
//   { id: "potato", name: "Snack khoai tây", price: 16000 },
//   { id: "medium", name: "Snack tầm trung", price: 12000 },
// ];

const FoodDrinkModal: React.FC<FoodDrinkModalProps> = ({
  isOpen,
  onClose,
  scheduleId,
  refetch,
}) => {
  // State lưu trữ đơn hàng: số lượng cho mỗi món
  const [order, setOrder] = React.useState<{
    drinks: Record<string, number>;
    snacks: Record<string, number>;
  }>({
    drinks: { water: 0, soda: 0, tea: 0 },
    snacks: { regular: 0, potato: 0, medium: 0 },
  });

  const queryClient = useQueryClient();

  const data = queryClient.getQueryData<AxiosResponse<HTTPResponse<IFnbOrder>>>(
    ["fnbOrderByScheduleId", scheduleId]
  );

  console.log("data", data);

  const { user } = useAuth();

  useEffect(() => {
    if (data) {
      const orderData = data.data.result?.order as IFnbOrder["order"];

      setOrder(orderData);
    }
  }, [data]);

  const { mutate, isPending } = useMutation({
    mutationFn: fnbOrderApis.createFnbOrder,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Food and drink order created successfully",
      });
      onClose();
      refetch();
      setOrder({
        drinks: { water: 0, soda: 0, tea: 0 },
        snacks: { regular: 0, potato: 0, medium: 0 },
      });
    },
  });

  const handleQuantityChange = (
    type: "drinks" | "snacks",
    id: string,
    value: number
  ) => {
    setOrder((prev) => {
      // Create a default structure if prev or prev[type] is undefined
      const updatedPrev = prev || { drinks: {}, snacks: {} };
      const updatedType = updatedPrev[type] || {};

      return {
        ...updatedPrev,
        [type]: {
          ...updatedType,
          [id]: value,
        },
      };
    });
  };

  const totalPrice = () => {
    const totalDrinks =
      DRINK_OPTIONS?.reduce(
        (sum, drink) => sum + (order?.drinks?.[drink.id] || 0) * drink.price,
        0
      ) || 0;
    const totalSnacks =
      SNACK_OPTIONS?.reduce(
        (sum, snack) => sum + (order?.snacks?.[snack.id] || 0) * snack.price,
        0
      ) || 0;
    return totalDrinks + totalSnacks || 0;
  };

  const handleSubmit = () => {
    mutate({
      roomScheduleId: scheduleId || "",
      order: {
        drinks: Object.fromEntries(
          Object.entries(order.drinks).filter(([, quantity]) => quantity > 0)
        ),
        snacks: Object.fromEntries(
          Object.entries(order.snacks).filter(([, quantity]) => quantity > 0)
        ),
      },
      createdBy: user?.name || "",
    });
  };

  const handleClose = () => {
    setOrder({
      drinks: { water: 0, soda: 0, tea: 0 },
      snacks: { regular: 0, potato: 0, medium: 0 },
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Chọn Đồ Ăn & Đồ Uống</DialogTitle>
          <DialogDescription>
            Chọn món bạn muốn thêm vào sự kiện (tùy chọn)
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="drinks">
          <TabsList className="mb-4">
            <TabsTrigger value="drinks">Drinks</TabsTrigger>
            <TabsTrigger value="snacks">Snacks</TabsTrigger>
          </TabsList>
          <TabsContent value="drinks">
            <div className="space-y-4">
              {DRINK_OPTIONS.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.price.toLocaleString()} VND
                    </p>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={order?.drinks?.[item.id] || 0}
                    onChange={(e) =>
                      handleQuantityChange(
                        "drinks",
                        item.id,
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-16 border rounded p-1 text-center"
                  />
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="snacks">
            <div className="space-y-4">
              {SNACK_OPTIONS.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.price.toLocaleString()} VND
                    </p>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={order?.snacks?.[item.id] || 0}
                    onChange={(e) =>
                      handleQuantityChange(
                        "snacks",
                        item.id,
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-16 border rounded p-1 text-center"
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        <div className="mt-4 flex justify-between items-center">
          <p className="font-medium">
            Tổng: {totalPrice().toLocaleString()} VND
          </p>
          <Button onClick={handleSubmit} loading={isPending}>
            Xác Nhận
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} loading={isPending}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FoodDrinkModal;
