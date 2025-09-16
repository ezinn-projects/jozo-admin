# Room Timeline Table - Drag and Drop Feature

## Tổng quan

Component `RoomTimelineTable` đã được cập nhật với chức năng kéo thả (drag and drop) cho phép người dùng di chuyển các schedule blocks theo chiều ngang (thay đổi thời gian) và chiều dọc (thay đổi phòng).

## Tính năng mới

### 1. Kéo thả Schedule Blocks
- **Kéo theo chiều ngang**: Di chuyển schedule đến thời gian khác trong cùng phòng
- **Kéo theo chiều dọc**: Di chuyển schedule sang phòng khác
- **Visual feedback**: Hiển thị preview và animation khi kéo thả

### 2. Kiểm tra xung đột
- Tự động kiểm tra xung đột lịch trình khi di chuyển
- Hiển thị thông báo lỗi nếu có xung đột
- Ngăn chặn việc tạo ra lịch trình trùng lặp

### 3. Validation
- Kiểm tra thời gian hợp lệ (00:00 - 23:59)
- Kiểm tra thời gian bắt đầu không được sau thời gian kết thúc
- Validation real-time khi kéo thả

## Cách sử dụng

### Kéo thả Schedule
1. **Bắt đầu kéo**: Click và giữ chuột trên schedule block
2. **Di chuyển**: Kéo schedule đến vị trí mới (phòng khác hoặc thời gian khác)
3. **Thả**: Thả chuột để hoàn thành việc di chuyển

### Visual Feedback
- Schedule block sẽ có hiệu ứng opacity và scale khi đang kéo
- Phòng đích sẽ có background màu xanh nhạt khi drag over
- Tooltip hiển thị thông tin chi tiết và hướng dẫn kéo thả

## Cấu trúc Code

### State Management
```typescript
interface DragState {
  isDragging: boolean;
  scheduleId: string | null;
  startX: number;
  startY: number;
  originalRoomId: string;
  originalStartTime: string;
  originalEndTime: string;
}
```

### Event Handlers
- `handleDragStart`: Khởi tạo drag operation
- `handleDragOver`: Xử lý drag over với visual feedback
- `handleDragLeave`: Xóa visual feedback khi drag leave
- `handleDragEnd`: Kết thúc drag operation
- `handleDrop`: Xử lý drop với validation và update

### Validation Logic
1. **Conflict Check**: Kiểm tra xung đột với schedule khác
2. **Time Validation**: Kiểm tra thời gian hợp lệ
3. **Range Validation**: Kiểm tra thời gian nằm trong khoảng 0-24h

## API Integration

### Update Schedule
```typescript
const { mutate: updateSchedule } = useMutation({
  mutationFn: (payload: { id: string; schedule: Partial<IRoomSchedule> }) =>
    roomsScheduleApis.updateSchedule(payload.id, payload.schedule),
  onSuccess: () => {
    refetch();
    toast({
      title: "Thành công",
      description: "Đã cập nhật lịch trình",
    });
  },
  onError: (error) => {
    console.error("Error updating schedule:", error);
    toast({
      title: "Lỗi",
      description: "Không thể cập nhật lịch trình",
      variant: "destructive",
    });
  },
});
```

## Styling

### CSS Classes
- `cursor-move`: Con trỏ chuột khi hover schedule block
- `drag-over`: Background màu xanh khi drag over
- `opacity-50 scale-95`: Hiệu ứng khi đang kéo
- `transition-all duration-200`: Animation mượt mà

### Visual Feedback
- Schedule block có shadow và opacity thay đổi khi hover
- Phòng đích có background màu xanh nhạt khi drag over
- Tooltip hiển thị thông tin chi tiết

## Lưu ý

1. **Performance**: Chức năng kéo thả được tối ưu để tránh re-render không cần thiết
2. **Accessibility**: Hỗ trợ keyboard navigation và screen reader
3. **Error Handling**: Xử lý lỗi đầy đủ với thông báo user-friendly
4. **Mobile Support**: Responsive design cho mobile devices

## Tương lai

- [ ] Thêm animation mượt mà hơn
- [ ] Hỗ trợ multi-select và bulk move
- [ ] Thêm undo/redo functionality
- [ ] Hỗ trợ touch gestures cho mobile
- [ ] Thêm keyboard shortcuts 