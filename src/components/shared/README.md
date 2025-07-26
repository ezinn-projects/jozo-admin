# Role-Based Access Control (RBAC) System

Hệ thống kiểm soát quyền truy cập dựa trên vai trò (Role-Based Access Control) đã được triển khai trong ứng dụng.

## Các thành phần chính

### 1. Menu Items với Role Control
- File: `src/constants/menuItems.tsx`
- Mỗi menu item có thể có thuộc tính `roles` để xác định ai có thể truy cập
- Ví dụ:
```typescript
{
  title: "General Management",
  icon: Settings2,
  roles: [Role.Admin], // Chỉ admin mới có thể truy cập
  subItems: [...]
}
```

### 2. Hook useMenuItems
- File: `src/hooks/useMenuItems.ts`
- Tự động lọc menu items dựa trên role của user hiện tại
- Sử dụng trong `AppSideBar.tsx`

### 3. Hook usePermission
- File: `src/hooks/usePermission.ts`
- Cung cấp các hook để kiểm tra quyền truy cập:
  - `usePermission(requiredRoles)` - Kiểm tra quyền truy cập với danh sách roles
  - `useIsAdmin()` - Kiểm tra xem user có phải là admin không
  - `useIsStaff()` - Kiểm tra xem user có phải là staff không

### 4. Component RoleBasedContent
- File: `src/components/shared/RoleBasedContent.tsx`
- Hiển thị nội dung có điều kiện dựa trên role
- Ví dụ:
```tsx
<RoleBasedContent requiredRoles={[Role.Admin]}>
  <AdminOnlyContent />
</RoleBasedContent>
```

### 5. Component AccessDenied
- File: `src/components/shared/AccessDenied.tsx`
- Hiển thị thông báo khi user không có quyền truy cập

### 6. RoleGuard
- File: `src/components/guards/RoleGuard.tsx`
- Bảo vệ routes dựa trên role
- Sử dụng trong routing configuration

## Cách sử dụng

### 1. Thêm role control cho menu item mới
```typescript
// Trong src/constants/menuItems.tsx
{
  title: "New Feature",
  url: PATHS.NEW_FEATURE,
  icon: NewIcon,
  roles: [Role.Admin, Role.Staff], // Cả admin và staff đều có thể truy cập
}
```

### 2. Bảo vệ route mới
```typescript
// Trong src/hooks/useRoute.tsx
<Route element={<RoleGuard requiredRoles={[Role.Admin]} />}>
  <Route path={PATHS.NEW_FEATURE} element={<NewFeaturePage />} />
</Route>
```

### 3. Hiển thị nội dung có điều kiện
```tsx
import RoleBasedContent from "@/components/shared/RoleBasedContent";
import { Role } from "@/constants/enum";

<RoleBasedContent requiredRoles={[Role.Admin]}>
  <AdminOnlyButton />
</RoleBasedContent>
```

### 4. Kiểm tra quyền trong component
```tsx
import { useIsAdmin, usePermission } from "@/hooks/usePermission";
import { Role } from "@/constants/enum";

const MyComponent = () => {
  const isAdmin = useIsAdmin();
  const { hasAccess } = usePermission([Role.Admin, Role.Staff]);
  
  return (
    <div>
      {isAdmin && <AdminOnlyContent />}
      {hasAccess && <SharedContent />}
    </div>
  );
};
```

## Quyền truy cập hiện tại

### Admin (Role.Admin)
- Truy cập tất cả tính năng
- Quản lý General Management (Room Types, Pricing, Menu Items, Promotion)
- Quản lý Rooms
- Xem Calendar và Revenue Statistics

### Staff (Role.Staff)
- Quản lý Rooms
- Xem Calendar và Revenue Statistics
- **KHÔNG** truy cập General Management

## Lưu ý
- Tất cả menu items đều được lọc tự động dựa trên role của user
- Routes được bảo vệ ở cả client-side và server-side
- User sẽ được chuyển hướng đến trang Unauthorized nếu cố gắng truy cập trang không có quyền 