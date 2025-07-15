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
import { useGetAllMenus } from "@/hooks/use-fnb-menu";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface FoodDrinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleId: string;
  refetch: VoidFunction;
}

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
    variants: Record<string, Record<string, number>>; // menuId -> variantName -> quantity
  }>({
    drinks: {},
    snacks: {},
    variants: {},
  });

  // State cho tìm kiếm
  const [searchDrinks, setSearchDrinks] = React.useState("");
  const [searchSnacks, setSearchSnacks] = React.useState("");
  const [searchVariants, setSearchVariants] = React.useState("");
  const { data: menus } = useGetAllMenus();

  console.log("menus", menus);

  const queryClient = useQueryClient();

  const data = queryClient.getQueryData<AxiosResponse<HTTPResponse<IFnbOrder>>>(
    ["fnbOrderByScheduleId", scheduleId]
  );

  const { user } = useAuth();

  useEffect(() => {
    if (data && data.data.result?.order) {
      const orderData = data.data.result.order as IFnbOrder["order"];

      // Đảm bảo dữ liệu có cấu trúc đúng
      if (orderData && typeof orderData === "object") {
        console.log("Setting order data:", orderData);
        setOrder({
          drinks: orderData.drinks || {},
          snacks: orderData.snacks || {},
          variants: orderData.variants || {},
        });
      }
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
        variants: {},
      });
    },
  });

  const handleQuantityChange = (
    type: "drinks" | "snacks",
    id: string,
    value: number
  ) => {
    setOrder((prev) => {
      // Đảm bảo prev có cấu trúc đúng
      const updatedPrev = prev || { drinks: {}, snacks: {}, variants: {} };
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

  const handleVariantQuantityChange = (
    menuId: string,
    variantName: string,
    value: number
  ) => {
    setOrder((prev) => {
      const updatedPrev = prev || { drinks: {}, snacks: {}, variants: {} };
      const updatedVariants = updatedPrev.variants || {};
      const updatedMenuVariants = updatedVariants[menuId] || {};

      return {
        ...updatedPrev,
        variants: {
          ...updatedVariants,
          [menuId]: {
            ...updatedMenuVariants,
            [variantName]: value,
          },
        },
      };
    });
  };

  const totalPrice = () => {
    if (!order) {
      console.log("Order is null or undefined in totalPrice");
      return 0;
    }
    console.log("Order in totalPrice:", order);

    const totalDrinks =
      DRINK_OPTIONS?.reduce(
        (sum, drink) => sum + (order.drinks?.[drink.id] || 0) * drink.price,
        0
      ) || 0;
    const totalSnacks =
      SNACK_OPTIONS?.reduce(
        (sum, snack) => sum + (order.snacks?.[snack.id] || 0) * snack.price,
        0
      ) || 0;

    // Tính tổng giá variants
    const totalVariants = Object.entries(order.variants || {}).reduce(
      (total, [menuId, variantQuantities]) => {
        const menu = menus?.find((m) => m._id === menuId);
        if (!menu) return total;

        return (
          total +
          Object.entries(variantQuantities).reduce(
            (menuTotal, [variantName, quantity]) => {
              const variant = menu.variants?.find(
                (v) => v.name === variantName
              );
              if (!variant) return menuTotal;

              const price = variant.price
                ? parseFloat(variant.price.replace(/\./g, ""))
                : parseFloat(menu.price.replace(/\./g, ""));
              return menuTotal + quantity * price;
            },
            0
          )
        );
      },
      0
    );

    return totalDrinks + totalSnacks + totalVariants || 0;
  };

  const handleSubmit = () => {
    if (!order) return;

    // Lọc ra các variants có số lượng > 0
    const filteredVariants = Object.fromEntries(
      Object.entries(order.variants || {}).filter(([, variantQuantities]) => {
        return Object.values(variantQuantities).some(
          (quantity) => quantity > 0
        );
      })
    );

    const orderPayload: {
      drinks: Record<string, number>;
      snacks: Record<string, number>;
      variants?: Record<string, Record<string, number>>;
    } = {
      drinks: Object.fromEntries(
        Object.entries(order.drinks || {}).filter(
          ([, quantity]) => quantity > 0
        )
      ),
      snacks: Object.fromEntries(
        Object.entries(order.snacks || {}).filter(
          ([, quantity]) => quantity > 0
        )
      ),
    };

    // Chỉ thêm variants nếu có
    if (Object.keys(filteredVariants).length > 0) {
      orderPayload.variants = filteredVariants;
    }

    mutate({
      roomScheduleId: scheduleId || "",
      order: orderPayload,
      createdBy: user?.name || "",
    });
  };

  const handleClose = () => {
    setOrder({
      drinks: { water: 0, soda: 0, tea: 0 },
      snacks: { regular: 0, potato: 0, medium: 0 },
      variants: {},
    });
    onClose();
  };

  // Lọc menu có variants
  const menusWithVariants =
    menus?.filter(
      (menu) => menu.hasVariants && menu.variants && menu.variants.length > 0
    ) || [];

  // Lọc menu theo từ khóa tìm kiếm
  const filteredDrinks =
    menus?.filter(
      (item) =>
        item.category === "drinks" &&
        !item.hasVariants &&
        item.name.toLowerCase().includes(searchDrinks.toLowerCase())
    ) || [];

  const filteredSnacks =
    menus?.filter(
      (item) =>
        item.category === "snacks" &&
        !item.hasVariants &&
        item.name.toLowerCase().includes(searchSnacks.toLowerCase())
    ) || [];

  const filteredMenusWithVariants = menusWithVariants
    .filter(
      (menu) =>
        menu.name.toLowerCase().includes(searchVariants.toLowerCase()) ||
        menu.variants?.some((variant) =>
          variant.name.toLowerCase().includes(searchVariants.toLowerCase())
        )
    )
    .map((menu) => {
      // Nếu search trống, hiển thị tất cả variants
      if (!searchVariants.trim()) {
        return menu;
      }

      // Nếu search khớp với tên menu chính, hiển thị tất cả variants
      if (menu.name.toLowerCase().includes(searchVariants.toLowerCase())) {
        return menu;
      }

      // Nếu search khớp với variant, chỉ hiển thị variant đó
      const filteredVariants = menu.variants?.filter((variant) =>
        variant.name.toLowerCase().includes(searchVariants.toLowerCase())
      );

      return {
        ...menu,
        variants: filteredVariants,
      };
    })
    .filter((menu) => menu.variants && menu.variants.length > 0);

  // Đảm bảo order đã được khởi tạo
  if (!order) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[95vh] overflow-y-auto">
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
            {menusWithVariants.length > 0 && (
              <TabsTrigger value="variants">Variants</TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="drinks">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Tìm kiếm đồ uống..."
                  value={searchDrinks}
                  onChange={(e) => setSearchDrinks(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="max-h-[40vh] overflow-y-auto space-y-4">
                {filteredDrinks.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 rounded-md"
                      />
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.price.toLocaleString()} VND
                      </p>
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={order?.drinks?.[item._id] || 0}
                      onChange={(e) =>
                        handleQuantityChange(
                          "drinks",
                          item._id,
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-16 border rounded p-1 text-center"
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="snacks">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Tìm kiếm đồ ăn..."
                  value={searchSnacks}
                  onChange={(e) => setSearchSnacks(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="max-h-[40vh] overflow-y-auto space-y-4">
                {filteredSnacks.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 rounded-md"
                      />
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.price.toLocaleString()} VND
                      </p>
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={order?.snacks?.[item._id] || 0}
                      onChange={(e) =>
                        handleQuantityChange(
                          "snacks",
                          item._id,
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-16 border rounded p-1 text-center"
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          {menusWithVariants.length > 0 && (
            <TabsContent value="variants">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Tìm kiếm menu có variants..."
                    value={searchVariants}
                    onChange={(e) => setSearchVariants(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="max-h-[40vh] overflow-y-auto space-y-6">
                  {filteredMenusWithVariants.map((menu) => (
                    <div key={menu._id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 rounded-md border-l-4 border-blue-500">
                        <img
                          src={menu.image}
                          alt={menu.name}
                          className="w-12 h-12 rounded-md"
                        />
                        <div>
                          <h4 className="font-bold text-lg">{menu.name}</h4>
                          <p className="text-sm text-gray-600">
                            {menu.description}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3 pl-4">
                        {menu.variants?.map((variant) => (
                          <div
                            key={variant.name}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              {variant.image && (
                                <img
                                  src={variant.image}
                                  alt={variant.name}
                                  className="w-10 h-10 rounded-md"
                                />
                              )}
                              <div>
                                <p className="font-medium">{variant.name}</p>
                                <p className="text-sm text-gray-500">
                                  {variant.price
                                    ? variant.price.toLocaleString()
                                    : menu.price.toLocaleString()}{" "}
                                  VND
                                </p>
                              </div>
                            </div>
                            <input
                              type="number"
                              min={0}
                              value={
                                order?.variants?.[menu._id]?.[variant.name] || 0
                              }
                              onChange={(e) =>
                                handleVariantQuantityChange(
                                  menu._id,
                                  variant.name,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-16 border rounded p-1 text-center"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          )}
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
