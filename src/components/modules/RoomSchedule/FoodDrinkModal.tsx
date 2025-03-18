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
import { useMutation } from "@tanstack/react-query";
import fnbOrderApis from "@/apis/fnbOrder.apis";
import { toast } from "@/hooks/use-toast";

interface FoodDrinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleId: string;
  refetch: VoidFunction;
}

// Danh sách đồ uống
const drinks = [
  { id: "water", name: "Nước", price: 10000 },
  { id: "soda", name: "Nước ngọt", price: 15000 },
  { id: "tea", name: "Nước trà", price: 15000 },
];

// Danh sách snack
const snacks = [
  { id: "regular", name: "Snack thường", price: 10000 },
  { id: "potato", name: "Snack khoai tây", price: 16000 },
  { id: "medium", name: "Snack tầm trung", price: 12000 },
];

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

  const { mutate, isPending } = useMutation({
    mutationFn: fnbOrderApis.createFnbOrder,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Food and drink order created successfully",
      });
      onClose();
      refetch();
    },
  });

  const handleQuantityChange = (
    type: "drinks" | "snacks",
    id: string,
    value: number
  ) => {
    setOrder((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [id]: value,
      },
    }));
  };

  const totalPrice = () => {
    const totalDrinks = drinks.reduce(
      (sum, drink) => sum + (order.drinks[drink.id] || 0) * drink.price,
      0
    );
    const totalSnacks = snacks.reduce(
      (sum, snack) => sum + (order.snacks[snack.id] || 0) * snack.price,
      0
    );
    return totalDrinks + totalSnacks;
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
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
              {drinks.map((item) => (
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
                    value={order.drinks[item.id]}
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
              {snacks.map((item) => (
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
                    value={order.snacks[item.id]}
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
          <Button variant="outline" onClick={onClose} loading={isPending}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FoodDrinkModal;
