import UpsertMenuItemModal from "@/components/modules/FnB/UpsertMenuItemModal";
import { DeleteModal } from "@/components/shared/DeleteModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMenuItems, FnBMenuItem } from "@/hooks/use-menu-items";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

const MenuItemsPage = () => {
  const {
    menuItems,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    deleteMenuItem,
    refetch,
  } = useMenuItems();

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState<FnBMenuItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FnBMenuItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FnBMenuItem | null>(null);
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(
    new Set()
  );

  // Filter items based on search term
  useEffect(() => {
    const filtered = menuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.parent?.name &&
          item.parent.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredItems(filtered);
  }, [menuItems, searchTerm]);

  const handleEdit = (item: FnBMenuItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (item: FnBMenuItem) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete?._id) {
      deleteMenuItem(itemToDelete._id);
    }
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const toggleVariants = (itemId: string) => {
    const newExpanded = new Set(expandedVariants);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedVariants(newExpanded);
  };

  // Group items by parent for display
  const displayItems = filteredItems.reduce((acc, item) => {
    if (item.parentId) {
      // This is a variant
      const parent = acc.find((p) => p._id === item.parentId);
      if (parent) {
        if (!parent.variants) parent.variants = [];
        parent.variants.push(item);
      }
    } else {
      // This is a parent item
      acc.push({ ...item, variants: [] });
    }
    return acc;
  }, [] as FnBMenuItem[]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Menu Items</h1>
          <p className="text-muted-foreground">
            Quản lý các món ăn, đồ uống và variants
          </p>
        </div>
        <Button onClick={handleCreate} disabled={isCreating}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm Menu Item
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Tìm kiếm menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Menu Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Menu Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hình ảnh</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Tồn kho</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayItems.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 rounded-md object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No img</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      {item.parent && (
                        <div className="text-sm text-gray-500">
                          Variant của: {item.parent.name}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.hasVariant ? "default" : "secondary"}>
                      {item.hasVariant ? "Có variants" : "Đơn lẻ"}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.price.toLocaleString()} VND</TableCell>
                  <TableCell>
                    {item.hasVariant ? (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">
                          {item.variants?.reduce(
                            (total, variant) =>
                              total + variant.inventory.quantity,
                            0
                          ) || 0}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          Tổng variants
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            item.inventory.quantity > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {item.inventory.quantity}
                        </span>
                        {item.inventory.quantity === 0 && (
                          <Badge variant="destructive" className="text-xs">
                            Hết hàng
                          </Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.hasVariant && item.variants ? (
                      <div className="space-y-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => item._id && toggleVariants(item._id)}
                          className="h-auto p-1 text-xs"
                        >
                          {item._id && expandedVariants.has(item._id) ? (
                            <ChevronDown className="w-3 h-3 mr-1" />
                          ) : (
                            <ChevronRight className="w-3 h-3 mr-1" />
                          )}
                          {item.variants.length} variants
                        </Button>

                        {item._id && expandedVariants.has(item._id) && (
                          <div className="ml-4 space-y-1 border-l-2 border-gray-200 pl-3">
                            {item.variants.map((variant) => (
                              <div
                                key={variant._id}
                                className="text-sm text-gray-600 flex items-center justify-between"
                              >
                                <span>• {variant.name}</span>
                                <Badge
                                  variant={
                                    variant.inventory.quantity > 0
                                      ? "outline"
                                      : "destructive"
                                  }
                                  className="text-xs"
                                >
                                  {variant.inventory.quantity}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Không có</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        disabled={isUpdating}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {displayItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm
                ? "Không tìm thấy menu items nào"
                : "Chưa có menu items nào"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <UpsertMenuItemModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        item={selectedItem}
        onSuccess={refetch}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Xóa Menu Item"
        description={`Bạn có chắc chắn muốn xóa "${itemToDelete?.name}"? Hành động này không thể hoàn tác.`}
      />
    </div>
  );
};

export default MenuItemsPage;
