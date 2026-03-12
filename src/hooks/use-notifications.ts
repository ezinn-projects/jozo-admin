import { 
  INotificationQuery, 
  INotificationListResponse, 
} from "@/@types/Notification";
import notificationApis from "@/apis/notification.apis";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const NOTIFICATION_QUERY_KEYS = {
  all: ["notifications"] as const,
  list: (params?: INotificationQuery) => [...NOTIFICATION_QUERY_KEYS.all, "list", params] as const,
};

// Hook để lấy danh sách notifications
export const useNotifications = (params?: INotificationQuery) => {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.list(params),
    queryFn: async (): Promise<INotificationListResponse> => {
      const response = await notificationApis.getNotifications(params);
      // API trả về { message, result: { notifications, total, page, limit, totalPages } }
      return response.data.result as INotificationListResponse;
    },
  });
};

// Hook để đánh dấu đã đọc
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationApis.markAsRead(notificationId),
    onSuccess: () => {
      // Invalidate để refetch notifications và unread count
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.all,
      });
    },
  });
};

// Hook để đánh dấu tất cả đã đọc
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationApis.markAllAsRead(),
    onSuccess: () => {
      // Invalidate để refetch notifications và unread count
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.all,
      });
    },
  });
};

// Hook để xóa notification
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationApis.deleteNotification(notificationId),
    onSuccess: () => {
      // Invalidate để refetch notifications và unread count
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.all,
      });
    },
  });
};

