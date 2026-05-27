import {
  ICoffeeSessionOrder,
  ICoffeeSessionOrderDetail,
} from "@/@types/CoffeeSessionOrder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FnBMenuItem } from "@/hooks/use-menu-items";
import { Coffee, Search, Utensils } from "lucide-react";
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
        normalize(child.name).includes(term),
      );
    });
  }, [groupedItems, searchTerm, selectedCategory]);

  const quantities = React.useMemo(() => {
    if (Array.isArray(order.lines) && order.lines.length > 0) {
      return order.lines.reduce<Record<string, number>>((acc, line) => {
        const itemId = String(line.itemId || "");
        const quantity = Number(line.quantity) || 0;
        if (!itemId || quantity <= 0) return acc;
        acc[itemId] = (acc[itemId] || 0) + quantity;
        return acc;
      }, {});
    }

    return {
      ...(order.drinks || {}),
      ...(order.snacks || {}),
    };
  }, [order]);

  const totalSelectedItems = React.useMemo(
    () =>
      Object.values(quantities).reduce(
        (sum, quantity) => sum + (Number(quantity) || 0),
        0,
      ),
    [quantities],
  );

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
                        onQuantityChange(
                          child,
                          Math.max(0, currentQuantity - 1),
                        )
                      }
                    >
                      -
                    </Button>
                    <Badge
                      variant="secondary"
                      className="min-w-10 justify-center"
                    >
                      {currentQuantity}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isUpdating}
                      onClick={() =>
                        child._id &&
                        onQuantityChange(child, currentQuantity + 1)
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
              onClick={() =>
                item._id &&
                onQuantityChange(item, Math.max(0, currentQuantity - 1))
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
                item._id && onQuantityChange(item, currentQuantity + 1)
              }
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
      {totalSelectedItems > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2">
          <p className="text-sm text-muted-foreground">
            Đang chọn{" "}
            <span className="font-medium text-foreground">
              {totalSelectedItems} món
            </span>
          </p>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isUpdating}
            onClick={onClearOrder}
          >
            Xóa toàn bộ order
          </Button>
        </div>
      ) : null}

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
