import { ICoffeeSessionOrder, ICoffeeSessionOrderDetail } from "@/@types/CoffeeSessionOrder";
import { FnBMenuItem } from "@/hooks/use-menu-items";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coffee, Search, Trash2, Utensils } from "lucide-react";
import React from "react";

interface CoffeeOrderEditorProps {
  menuItems: FnBMenuItem[];
  order: ICoffeeSessionOrder;
  orderDetail?: ICoffeeSessionOrderDetail | null;
  isUpdating: boolean;
  onQuantityChange: (item: FnBMenuItem, nextQuantity: number) => void;
  onClearOrder: () => void;
}

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d");

const CoffeeOrderEditor: React.FC<CoffeeOrderEditorProps> = ({
  menuItems,
  order,
  orderDetail,
  isUpdating,
  onQuantityChange,
  onClearOrder,
}) => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");

  const groupedItems = React.useMemo(() => {
    const parents: FnBMenuItem[] = [];
    const childrenMap: Record<string, FnBMenuItem[]> = {};

    menuItems.forEach((item) => {
      if (!item.parentId) {
        parents.push(item);
        return;
      }

      if (!childrenMap[item.parentId]) {
        childrenMap[item.parentId] = [];
      }

      childrenMap[item.parentId].push(item);
    });

    return { parents, childrenMap };
  }, [menuItems]);

  const filteredParentItems = React.useMemo(() => {
    const term = normalize(searchTerm.trim());

    return groupedItems.parents.filter((parent) => {
      const category = parent.category.toLowerCase();
      const categoryMatch =
        selectedCategory === "all" ||
        category === selectedCategory ||
        `${category}s` === selectedCategory;

      if (!categoryMatch) return false;

      if (!term) return true;

      if (
        normalize(parent.name).includes(term) ||
        normalize(parent.category).includes(term)
      ) {
        return true;
      }

      return (groupedItems.childrenMap[parent._id || ""] || []).some((child) =>
        normalize(child.name).includes(term)
      );
    });
  }, [groupedItems, searchTerm, selectedCategory]);

  const quantities = React.useMemo(() => {
    return {
      ...(order.drinks || {}),
      ...(order.snacks || {}),
    };
  }, [order]);

  const orderedItems = React.useMemo(() => {
    if (orderDetail?.items) {
      return [...orderDetail.items.drinks, ...orderDetail.items.snacks];
    }

    return Object.entries(quantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([itemId, quantity]) => {
        const menuItem = menuItems.find((item) => item._id === itemId);
        return {
          itemId,
          name: menuItem?.name || itemId,
          category: menuItem?.category || "other",
          quantity,
          price: menuItem?.price || 0,
        };
      });
  }, [menuItems, orderDetail, quantities]);

  const totalItems = orderedItems.reduce((sum, item) => sum + item.quantity, 0);

  const renderMenuItem = (item: FnBMenuItem) => {
    const children = groupedItems.childrenMap[item._id || ""] || [];

    if (children.length > 0) {
      return (
        <Card key={item._id} className="border-muted">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{item.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {children.map((child) => {
              const currentQuantity = quantities[child._id || ""] || 0;
              return (
                <div
                  key={child._id}
                  className="flex items-center justify-between gap-3 rounded-md border p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{child.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {child.price.toLocaleString("vi-VN")} VND
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isUpdating || currentQuantity <= 0}
                      onClick={() =>
                        child._id &&
                        onQuantityChange(child, Math.max(0, currentQuantity - 1))
                      }
                    >
                      -
                    </Button>
                    <Badge variant="secondary" className="min-w-10 justify-center">
                      {currentQuantity}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isUpdating}
                      onClick={() =>
                        child._id && onQuantityChange(child, currentQuantity + 1)
                      }
                    >
                      +
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      );
    }

    const currentQuantity = quantities[item._id || ""] || 0;

    return (
      <Card key={item._id} className="border-muted">
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground">
              {item.price.toLocaleString("vi-VN")} VND
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isUpdating || currentQuantity <= 0}
              onClick={() => item._id && onQuantityChange(item, Math.max(0, currentQuantity - 1))}
            >
              -
            </Button>
            <Badge variant="secondary" className="min-w-10 justify-center">
              {currentQuantity}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              disabled={isUpdating}
              onClick={() => item._id && onQuantityChange(item, currentQuantity + 1)}
            >
              +
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-medium">Order hiện tại</p>
            <p className="text-sm text-muted-foreground">
              {totalItems > 0 ? `${totalItems} món đã chọn` : "Chưa có món nào"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={isUpdating || totalItems === 0}
            onClick={onClearOrder}
          >
            <Trash2 className="h-4 w-4" />
            Xóa order
          </Button>
        </div>

        {orderedItems.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {orderedItems.map((item) => (
              <Badge key={item.itemId} variant="secondary">
                {item.name} x{item.quantity}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Tìm món ăn hoặc đồ uống..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="drink">
            <Coffee className="h-4 w-4" />
            Đồ uống
          </TabsTrigger>
          <TabsTrigger value="snack">
            <Utensils className="h-4 w-4" />
            Đồ ăn
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredParentItems.length === 0 ? (
          <div className="col-span-full rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Không có món phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          filteredParentItems.map(renderMenuItem)
        )}
      </div>
    </div>
  );
};

export default CoffeeOrderEditor;
