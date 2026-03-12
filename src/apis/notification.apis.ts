import {
  INotification,
  INotificationListResponse,
  INotificationQuery,
} from "@/@types/Notification";
import http from "@/utils/http";

const notificationApis = {
  // Lấy danh sách notifications
  getNotifications: (params?: INotificationQuery) => {
    return http.get<HTTPResponse<INotificationListResponse>>("/notifications", {
      params,
    });
  },

  // Đánh dấu một notification đã đọc
  markAsRead: (notificationId: string) => {
    return http.put<INotification>(`/notifications/${notificationId}/read`);
  },

  // Đánh dấu tất cả notifications đã đọc
  markAllAsRead: () => {
    return http.put<{ success: boolean; modifiedCount: number }>(
      "/notifications/read-all"
    );
  },

  // Xóa một notification
  deleteNotification: (notificationId: string) => {
    return http.delete<{ success: boolean; message: string }>(
      `/notifications/${notificationId}`
    );
  },
};

export default notificationApis;

