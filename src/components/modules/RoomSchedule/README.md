# MenuItemsModal Component

## Mô tả
Modal hiển thị danh sách menu items theo cấu trúc mới với category và variants.

## Tính năng
- Hiển thị danh sách menu items theo category (drinks, snacks, etc.)
- Hỗ trợ tìm kiếm theo tên món hoặc category
- Hiển thị variants cho các món có nhiều lựa chọn
- Responsive design với grid layout
- Hiển thị thông tin tồn kho và giá cả

## Props

```typescript
interface MenuItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  onItemSelect?: (item: MenuItem, variant?: MenuItemVariant) => void;
}
```

## Cách sử dụng

```tsx
import MenuItemsModal from "@/components/modules/RoomSchedule/MenuItemsModal";
import { useGetMenuItems } from "@/hooks/use-menu-items";

const MyComponent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: menuItems } = useGetMenuItems();

  const handleItemSelect = (item: MenuItem, variant?: MenuItemVariant) => {
    console.log("Selected item:", item);
    console.log("Selected variant:", variant);
    // Thêm logic xử lý khi chọn item
  };

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>
        Mở Menu Items
      </Button>

      <MenuItemsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        menuItems={menuItems || []}
        onItemSelect={handleItemSelect}
      />
    </>
  );
};
```

## Cấu trúc dữ liệu

### MenuItem
```typescript
interface MenuItem {
  _id: string;
  name: string;
  parentId: string | null;
  hasVariant: boolean;
  price: number;
  image: string;
  category: string;
  inventory: {
    quantity: number;
    minStock?: number;
    maxStock?: number;
    lastUpdated?: string;
  };
  createdAt: string;
  updatedAt: string;
  existingImage?: string;
  quantity?: string;
  variants?: string; // JSON string của variants
}
```

### MenuItemVariant
```typescript
interface MenuItemVariant {
  name: string;
  price: number;
  image: string;
  inventory: {
    quantity: number;
    minStock?: number;
    maxStock?: number;
  };
}
```

## Hook liên quan

### useGetMenuItems
Hook để lấy tất cả menu items:
```typescript
const { data: menuItems, isLoading, error } = useGetMenuItems();
```

### useGetMenuItemsByCategory
Hook để lấy menu items theo category:
```typescript
const { data: drinks } = useGetMenuItemsByCategory("drinks");
const { data: snacks } = useGetMenuItemsByCategory("snacks");
```

## Demo
Xem file `MenuItemsModalDemo.tsx` để có ví dụ sử dụng đầy đủ. 