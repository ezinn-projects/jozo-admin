# Chức năng Đặt hàng F&B từ Client

## Tổng quan
Chức năng này cho phép admin nhận thông báo khi có đơn hàng mới từ client và quản lý việc phục vụ đơn hàng.

## Cách hoạt động

### 1. Lắng nghe Event từ Backend
- Backend gửi event `admin_notification` với type `new_order` khi có đơn hàng mới
- Admin panel tự động lắng nghe và hiển thị thông báo

### 2. Hiển thị Thông báo
- Icon đồ ăn (🍴) màu cam xuất hiện bên cạnh tên phòng
- Icon nhấp nháy trong 30 giây để thu hút sự chú ý
- Toast notification hiển thị thông tin đơn hàng
- Text-to-speech đọc thông báo bằng tiếng Việt

### 3. Xem Chi tiết Đơn hàng
- Click vào icon đồ ăn để mở modal chi tiết
- Modal hiển thị:
  - Thông tin khách hàng (phòng, thời gian đặt)
  - Danh sách món ăn với số lượng và giá
  - Tổng tiền
  - Mã đơn hàng và trạng thái

### 4. Xác nhận Phục vụ
- Click nút "Xác nhận đã phục vụ" để mark order as served
- Gọi API `POST /rooms/:roomId/orders/:orderId/serve`
- Xóa thông báo sau khi phục vụ thành công

## Cấu trúc Code

### Files đã tạo/cập nhật:

1. **`src/apis/fnbOrder.apis.ts`**
   - Thêm API `markOrderAsServed`

2. **`src/hooks/useSocket.ts`**
   - Thêm `onAdminNotification` và `offAdminNotification`
   - Type-safe cho order data

3. **`src/components/modules/RoomSchedule/OrderDetailsModal.tsx`**
   - Modal hiển thị chi tiết đơn hàng
   - Form xác nhận phục vụ

4. **`src/pages/RoomSchedule/components/RoomTimelineTable.tsx`**
   - Tích hợp socket listener cho new_order_notification
   - Hiển thị icon đồ ăn khi có đơn hàng mới
   - Quản lý state cho order notifications

## Data Structure

### OrderData Interface:
```typescript
interface OrderData {
  orderId: string;
  items: Array<{
    itemId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  customerInfo: {
    roomName: string;
    roomScheduleId: string;
  };
  createdAt: string;
}
```

### Socket Event Structure:
```typescript
{
  type: 'new_order',
  roomId: string,
  message: string,
  timestamp: number,
  orderData: OrderData
}
```

## Tính năng

- ✅ Lắng nghe real-time notifications
- ✅ Hiển thị icon đồ ăn với animation
- ✅ Modal chi tiết đơn hàng
- ✅ Xác nhận phục vụ với API call
- ✅ Text-to-speech thông báo
- ✅ Auto-cleanup notifications cũ
- ✅ Type-safe với TypeScript
- ✅ Responsive UI với Tailwind CSS

## Cách Test

1. Đảm bảo backend đang chạy và có thể gửi event `admin_notification`
2. Tạo đơn hàng từ client
3. Kiểm tra admin panel có hiển thị icon đồ ăn không
4. Click vào icon để xem chi tiết đơn hàng
5. Click "Xác nhận đã phục vụ" để test API call
