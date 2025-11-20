import { INotification } from "@/@types/Notification";
import { PageHeader } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import PATHS from "@/constants/paths";
import {
  useDeleteNotification,
  useMarkAllAsRead,
  useMarkAsRead,
  useNotifications,
  useUnreadCount,
} from "@/hooks/use-notifications";
import { formatUTCToLocal, timeAgo } from "@/lib/dayjs";
import { cn } from "@/lib/utils";
import {
  Bell,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  CheckCheck,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ITEMS_PER_PAGE = 20;

function NotificationsPage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch notifications
  const { data: unreadCountData } = useUnreadCount();
  const { data: notificationsData, isLoading } = useNotifications({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
  });

  // Mutations
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead } = useMarkAllAsRead();
  const { mutate: deleteNotification } = useDeleteNotification();

  const unreadCount = unreadCountData?.count || 0;
  const notifications = notificationsData?.notifications || [];
  const totalPages = notificationsData?.totalPages || 1;
  const total = notificationsData?.total || 0;

  const handleNotificationClick = (notification: INotification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    // Navigate to my-schedule page with scheduleId if available
    if (notification.data?.scheduleId) {
      navigate(
        `${PATHS.MY_SCHEDULE}?scheduleId=${notification.data.scheduleId}`
      );
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleDeleteNotification = (
    e: React.MouseEvent,
    notificationId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    deleteNotification(notificationId);
  };

  const getNotificationIcon = (notification: INotification) => {
    switch (notification.type) {
      case "schedule_approved":
        return <CalendarCheck className="h-5 w-5 text-green-600" />;
      case "schedule_rejected":
        return <CalendarX className="h-5 w-5 text-red-600" />;
      case "schedule_assigned":
      case "schedule_registered":
      case "schedule_created_by_employee":
      case "schedule_status_updated":
        return <CalendarClock className="h-5 w-5 text-blue-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className={cn(
                currentPage === 1 && "pointer-events-none opacity-50"
              )}
            />
          </PaginationItem>

          {startPage > 1 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => setCurrentPage(1)}>
                  1
                </PaginationLink>
              </PaginationItem>
              {startPage > 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
            </>
          )}

          {pages.map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => setCurrentPage(page)}
                isActive={currentPage === page}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink onClick={() => setCurrentPage(totalPages)}>
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              className={cn(
                currentPage === totalPages && "pointer-events-none opacity-50"
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <PageHeader
        title="Tất cả thông báo"
        description={`${total} thông báo${unreadCount > 0 ? ` • ${unreadCount} chưa đọc` : ""}`}
        icon={Bell}
        actions={
          unreadCount > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                Đánh dấu tất cả đã đọc
              </Button>
          ) : undefined
        }
      />

      <Card>
        <CardContent className="p-6">

          {/* Notifications List */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <h3 className="text-lg font-semibold mb-1">Không có thông báo</h3>
              <p className="text-sm text-muted-foreground">
                Bạn chưa có thông báo nào
              </p>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[calc(100vh-320px)]">
                <div className="space-y-2">
                  {notifications.map((notification: INotification) => (
                    <div
                      key={notification._id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "relative rounded-lg p-4 cursor-pointer transition-all hover:shadow-md border group",
                        !notification.isRead
                          ? "bg-blue-50 border-blue-200 hover:bg-blue-100"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      <div className="flex gap-4">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4
                              className={cn(
                                "text-base font-medium",
                                !notification.isRead && "font-semibold"
                              )}
                            >
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {!notification.isRead && (
                                <Badge
                                  variant="default"
                                  className="h-2 w-2 p-0 rounded-full"
                                />
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) =>
                                  handleDeleteNotification(e, notification._id)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mb-3">
                            {notification.body}
                          </p>

                          <div className="flex items-center gap-4">
                            <p className="text-xs text-muted-foreground">
                              {formatUTCToLocal(notification.createdAt)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {timeAgo(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Pagination */}
              {renderPagination()}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default NotificationsPage;
