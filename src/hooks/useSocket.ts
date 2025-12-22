import { useEffect, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { useToast } from "./use-toast";
import useAuth from "./useAuth";
import { INotification } from "@/@types/Notification";
import { Gift } from "@/@types/Gift";

interface BookingData {
  roomId: string;
  booking?: {
    bookingId?: string;
    _id?: string;
    roomId: string;
    roomName?: string;
    roomType?: string;
    originalRequest?: string;
    upgraded?: boolean;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    startTime: string;
    endTime: string;
    note?: string;
    source?: string;
    createdAt: string;
  };
  bookingId?: string;
  _id?: string;
  roomName?: string;
  roomType?: string;
  originalRequest?: string;
  upgraded?: boolean;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  startTime: string;
  endTime: string;
  note?: string;
  source?: string;
  createdAt: string;
  [key: string]: unknown;
}

export const useSocket = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const socketRef = useRef<typeof Socket | null>(null);

  useEffect(() => {
    if (!user) return;

    const userRole = user.role; // 'admin', 'staff', hoặc 'user'
    const userId = user._id;

    // Chỉ admin và staff mới kết nối đến management room
    if (userRole !== "admin" && userRole !== "staff") {
      return;
    }

    // Initialize socket connection với query params mới
    const queryParams: { role: string; userId?: string } = {
      role: userRole, // 'admin' hoặc 'staff'
    };

    // Thêm userId cho staff để nhận notifications riêng
    if (userRole === "staff") {
      queryParams.userId = userId;
    }

    socketRef.current = io(import.meta.env.VITE_SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      query: queryParams,
      transports: ["websocket"],
    });

    // Setup reconnection handling
    socketRef.current.on("connect", () => {
      // Backend sẽ tự động join vào management room cho admin và staff
      // Staff vẫn cần join vào room user:userId để nhận notifications riêng
      if (userRole === "staff") {
        socketRef.current?.emit("join_room", `user:${userId}`);
      }
      // Admin không cần join room riêng vì đã được join vào management room tự động
    });

    socketRef.current.on("disconnect", () => {
      console.error("Socket disconnected");
    });

    socketRef.current.on("connect_error", (error: Error) => {
      console.error("Socket connection error:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [toast, user]);

  const joinRoom = (roomId: string) => {
    socketRef.current?.emit("join_room", roomId);
  };

  const leaveRoom = (roomId: string) => {
    socketRef.current?.emit("leave_room", roomId);
  };

  const onNotification = (
    callback: (data: { roomId: string; message: string }) => void
  ) => {
    socketRef.current?.on("notification", callback);
  };

  const offNotification = (
    callback: (data: { roomId: string; message: string }) => void
  ) => {
    socketRef.current?.off("notification", callback);
  };

  const onNewOrderNotification = (
    callback: (data: {
      type: string;
      roomId: string;
      message: string;
      timestamp: number;
      orderData: {
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
      };
    }) => void
  ) => {
    socketRef.current?.on("new_order_notification", callback);
  };

  const offNewOrderNotification = (
    callback: (data: {
      type: string;
      roomId: string;
      message: string;
      timestamp: number;
      orderData: {
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
      };
    }) => void
  ) => {
    socketRef.current?.off("new_order_notification", callback);
  };

  const onNewBooking = (callback: (data: BookingData) => void) => {
    socketRef.current?.on("booking_notification", callback);
  };

  const offNewBooking = (callback: (data: BookingData) => void) => {
    socketRef.current?.off("booking_notification", callback);
  };

  // Employee Schedule Events
  const onNewScheduleRegistration = (
    callback: (data: {
      userId: string;
      userName?: string;
      schedules: Array<{
        date: string;
        shiftType: string;
        status: string;
      }>;
      message: string;
    }) => void
  ) => {
    socketRef.current?.on("new_schedule_registration", callback);
  };

  const offNewScheduleRegistration = (
    callback: (data: {
      userId: string;
      userName?: string;
      schedules: Array<{
        date: string;
        shiftType: string;
        status: string;
      }>;
      message: string;
    }) => void
  ) => {
    socketRef.current?.off("new_schedule_registration", callback);
  };

  const onScheduleStatusUpdated = (
    callback: (data: {
      scheduleId: string;
      schedule: {
        _id: string;
        date: string;
        shiftType: string;
        status: string;
        note?: string;
      };
      status: string;
      message: string;
    }) => void
  ) => {
    socketRef.current?.on("schedule_status_updated", callback);
  };

  const offScheduleStatusUpdated = (
    callback: (data: {
      scheduleId: string;
      schedule: {
        _id: string;
        date: string;
        shiftType: string;
        status: string;
        note?: string;
      };
      status: string;
      message: string;
    }) => void
  ) => {
    socketRef.current?.off("schedule_status_updated", callback);
  };

  const onScheduleAssigned = (
    callback: (data: {
      schedules: Array<{
        _id: string;
        date: string;
        shiftType: string;
        status: string;
        note?: string;
      }>;
      message: string;
    }) => void
  ) => {
    socketRef.current?.on("schedule_assigned", callback);
  };

  const offScheduleAssigned = (
    callback: (data: {
      schedules: Array<{
        _id: string;
        date: string;
        shiftType: string;
        status: string;
        note?: string;
      }>;
      message: string;
    }) => void
  ) => {
    socketRef.current?.off("schedule_assigned", callback);
  };

  // Notification listeners
  const onNewNotification = (
    callback: (notification: INotification) => void
  ) => {
    socketRef.current?.on("new_notification", callback);
  };

  const offNewNotification = (
    callback: (notification: INotification) => void
  ) => {
    socketRef.current?.off("new_notification", callback);
  };

  // Gift claimed event listener
  const onGiftClaimed = (
    callback: (data: { roomId: string; scheduleId: string; gift: Gift }) => void
  ) => {
    socketRef.current?.on("gift_claimed", callback);
  };

  const offGiftClaimed = (
    callback: (data: { roomId: string; scheduleId: string; gift: Gift }) => void
  ) => {
    socketRef.current?.off("gift_claimed", callback);
  };

  return {
    socket: socketRef.current,
    joinRoom,
    leaveRoom,
    onNotification,
    offNotification,
    onNewOrderNotification,
    offNewOrderNotification,
    onNewBooking,
    offNewBooking,
    onNewScheduleRegistration,
    offNewScheduleRegistration,
    onScheduleStatusUpdated,
    offScheduleStatusUpdated,
    onScheduleAssigned,
    offScheduleAssigned,
    onNewNotification,
    offNewNotification,
    onGiftClaimed,
    offGiftClaimed,
  };
};
