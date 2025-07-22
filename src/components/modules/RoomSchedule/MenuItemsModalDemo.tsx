import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import MenuItemsModal from "./MenuItemsModal";
import {
  MenuItem,
  MenuItemVariant,
  useCompleteOrder,
} from "@/hooks/use-menu-items";
import { ICompleteOrderResult } from "@/apis/fnbOrder.apis";

// Dữ liệu mẫu theo cấu trúc API mới
const sampleMenuItems: MenuItem[] = [
  {
    _id: "6878dfa268a6207868521317",
    name: "kho fansipan",
    parentId: "",
    hasVariant: true,
    price: 17000,
    image:
      "https://res.cloudinary.com/dfl9ynmdl/image/upload/v1752752033/menu-items/ierhxi4ajxv1msit1pfe.jpg",
    inventory: {
      quantity: 0,
      lastUpdated: "2025-07-18T05:19:16.777Z",
    },
    createdAt: "2025-07-17T11:33:54.785Z",
    updatedAt: "2025-07-17T11:33:54.785Z",
    existingImage:
      "https://res.cloudinary.com/dfl9ynmdl/image/upload/v1752752033/menu-items/ierhxi4ajxv1msit1pfe.jpg",
    quantity: "0",
    variants:
      '[{"name":"Heo cháy tỏi","price":17000,"image":"https://res.cloudinary.com/dfl9ynmdl/image/upload/v1752752035/menu-items/variants/befmavwlyjh1yo7hzjji.jpg","inventory":{"quantity":5,"minStock":5,"maxStock":50}},{"name":"Gà cay","price":17000,"image":"https://res.cloudinary.com/dfl9ynmdl/image/upload/v1752752037/menu-items/variants/kuqwdkwxpoqa6wzmnvsk.jpg","inventory":{"quantity":6,"minStock":5,"maxStock":50}},{"name":"khô bò","price":17000,"image":"https://res.cloudinary.com/dfl9ynmdl/image/upload/v1752752038/menu-items/variants/ox6aok5ygznhqx3q5fmg.jpg","inventory":{"quantity":5,"minStock":5,"maxStock":50}}]',
    category: "snack",
  },
  {
    _id: "6878dfa468a6207868521318",
    name: "Heo cháy tỏi",
    parentId: "6878dfa268a6207868521317",
    hasVariant: false,
    price: 17000,
    image:
      "https://res.cloudinary.com/dfl9ynmdl/image/upload/v1752752035/menu-items/variants/befmavwlyjh1yo7hzjji.jpg",
    category: "snack",
    inventory: {
      quantity: 5,
      minStock: 5,
      maxStock: 50,
      lastUpdated: "2025-07-17T11:33:56.475Z",
    },
    createdAt: "2025-07-17T11:33:56.475Z",
    updatedAt: "2025-07-17T11:33:56.475Z",
  },
  {
    _id: "6879eaf3fb665648793f5511",
    name: "Snack Swing",
    parentId: null,
    hasVariant: false,
    price: 15000,
    image:
      "https://res.cloudinary.com/dfl9ynmdl/image/upload/v1752820466/menu-items/fwxwmp3xqa4pe16mwook.png",
    category: "snack",
    inventory: {
      quantity: 2,
      minStock: undefined,
      maxStock: undefined,
      lastUpdated: "2025-07-18T06:34:27.834Z",
    },
    createdAt: "2025-07-18T06:34:27.834Z",
    updatedAt: "2025-07-18T06:34:27.834Z",
  },
  {
    _id: "6879dd12fb665648793f5501",
    name: "Snack Lay's",
    parentId: "",
    hasVariant: true,
    price: 15000,
    image:
      "https://res.cloudinary.com/dfl9ynmdl/image/upload/v1752816913/menu-items/agulua1mtvsvhak0kp3d.jpg",
    category: "snack",
    inventory: {
      quantity: 0,
      lastUpdated: "2025-07-18T05:49:01.636Z",
    },
    createdAt: "2025-07-18T05:35:14.510Z",
    updatedAt: "2025-07-18T05:35:14.510Z",
    existingImage:
      "https://res.cloudinary.com/dfl9ynmdl/image/upload/v1752816913/menu-items/agulua1mtvsvhak0kp3d.jpg",
    quantity: "0",
    variants:
      '[{"name":"Vị khoai tây tự nhiên","price":15000,"image":"https://res.cloudinary.com/dfl9ynmdl/image/upload/v1752816915/menu-items/variants/p2bowcjqe2iibvpa7x4z.jpg","inventory":{"quantity":2,"minStock":5,"maxStock":50}},{"name":"Vị tôm càng phô mai tan chảy","price":15000,"image":"https://res.cloudinary.com/dfl9ynmdl/image/upload/v1752816916/menu-items/variants/p61x27hewx5aqcg7yhvo.jpg","inventory":{"quantity":1,"minStock":5,"maxStock":50}}]',
  },
];

const MenuItemsModalDemo: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<
    Array<{
      item: MenuItem;
      variant?: MenuItemVariant;
      quantity: number;
    }>
  >([]);
  const [lastOrder, setLastOrder] = useState<ICompleteOrderResult | null>(null);

  const completeOrderMutation = useCompleteOrder();

  const handleItemSelect = (item: MenuItem, variant?: MenuItemVariant) => {
    console.log("Selected item:", item);
    console.log("Selected variant:", variant);

    // Thêm item vào danh sách đã chọn
    const existingItemIndex = selectedItems.findIndex(
      (selected) =>
        selected.item._id === item._id &&
        selected.variant?.name === variant?.name
    );

    if (existingItemIndex >= 0) {
      // Tăng số lượng nếu item đã tồn tại
      const updatedItems = [...selectedItems];
      updatedItems[existingItemIndex].quantity += 1;
      setSelectedItems(updatedItems);
    } else {
      // Thêm item mới
      setSelectedItems([...selectedItems, { item, variant, quantity: 1 }]);
    }
  };

  const handleCompleteOrder = () => {
    if (selectedItems.length === 0) {
      alert("Vui lòng chọn ít nhất một item");
      return;
    }

    const payload = {
      roomScheduleId: "room_id_example", // Thay bằng room ID thực tế
      items: selectedItems.map(({ item, variant, quantity }) => ({
        itemId: variant ? `${item._id}_${variant.name}` : item._id,
        quantity,
      })),
      createdBy: "user_id_example", // Thay bằng user ID thực tế
    };

    completeOrderMutation.mutate(payload, {
      onSuccess: (response) => {
        const result = response.data.result;
        console.log("Order created:", result?.order);
        console.log("Updated items:", result?.updatedItems);

        if (result) {
          setLastOrder(result);
        }
        setSelectedItems([]);
        setIsModalOpen(false);
      },
    });
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Demo Menu Items Modal</h1>

        <div className="space-y-4">
          <Button onClick={() => setIsModalOpen(true)}>
            Mở Menu Items Modal
          </Button>

          {selectedItems.length > 0 && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold mb-4">Items đã chọn:</h3>
              <div className="space-y-3">
                {selectedItems.map((selected, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-white rounded border"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{selected.item.name}</p>
                      {selected.variant && (
                        <p className="text-sm text-gray-600">
                          Variant: {selected.variant.name}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        Giá:{" "}
                        {(
                          selected.variant?.price || selected.item.price
                        ).toLocaleString("vi-VN")}{" "}
                        VND
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">
                        Số lượng: {selected.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const updatedItems = [...selectedItems];
                          if (updatedItems[index].quantity > 1) {
                            updatedItems[index].quantity -= 1;
                          } else {
                            updatedItems.splice(index, 1);
                          }
                          setSelectedItems(updatedItems);
                        }}
                      >
                        -
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const updatedItems = [...selectedItems];
                          updatedItems[index].quantity += 1;
                          setSelectedItems(updatedItems);
                        }}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-between items-center">
                <div className="text-lg font-semibold">
                  Tổng:{" "}
                  {selectedItems
                    .reduce(
                      (total, selected) =>
                        total +
                        (selected.variant?.price || selected.item.price) *
                          selected.quantity,
                      0
                    )
                    .toLocaleString("vi-VN")}{" "}
                  VND
                </div>
                <Button
                  onClick={handleCompleteOrder}
                  disabled={completeOrderMutation.isPending}
                >
                  {completeOrderMutation.isPending
                    ? "Đang xử lý..."
                    : "Hoàn thành Order"}
                </Button>
              </div>
            </div>
          )}
        </div>

        <MenuItemsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          menuItems={sampleMenuItems}
          onItemSelect={handleItemSelect}
          roomId="room_id_example"
          scheduleId="schedule_id_example"
          createdBy="user_id_example"
        />

        {/* Hiển thị thông tin order cuối cùng */}
        {lastOrder && (
          <div className="mt-8 p-6 border rounded-lg bg-green-50">
            <h3 className="text-xl font-bold mb-4 text-green-800">
              Order đã tạo thành công!
            </h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-green-700">
                  Thông tin Order:
                </h4>
                <p>
                  <strong>Order ID:</strong> {lastOrder.order._id}
                </p>
                <p>
                  <strong>Room Schedule ID:</strong>{" "}
                  {lastOrder.order.roomScheduleId}
                </p>
                <p>
                  <strong>Created By:</strong> {lastOrder.order.createdBy}
                </p>
                <p>
                  <strong>Created At:</strong>{" "}
                  {new Date(lastOrder.order.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-green-700">
                  Items trong Order:
                </h4>
                <div className="space-y-2">
                  {Object.entries(lastOrder.order.order.snacks || {}).map(
                    ([itemId, quantity]) => (
                      <p key={itemId} className="text-sm">
                        <strong>Snack ID {itemId}:</strong> {quantity} cái
                      </p>
                    )
                  )}
                  {Object.entries(lastOrder.order.order.drinks || {}).map(
                    ([itemId, quantity]) => (
                      <p key={itemId} className="text-sm">
                        <strong>Drink ID {itemId}:</strong> {quantity} cái
                      </p>
                    )
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-green-700">
                  Items đã được cập nhật:
                </h4>
                <div className="space-y-2">
                  {lastOrder.updatedItems.map((item) => (
                    <div key={item._id} className="p-3 bg-white rounded border">
                      <p>
                        <strong>Tên:</strong> {item.name}
                      </p>
                      <p>
                        <strong>Category:</strong> {item.category}
                      </p>
                      <p>
                        <strong>Giá:</strong>{" "}
                        {item.price.toLocaleString("vi-VN")} VND
                      </p>
                      <p>
                        <strong>Số lượng còn lại:</strong>{" "}
                        {item.inventory.quantity}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuItemsModalDemo;
