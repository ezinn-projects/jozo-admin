import { useEffect, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { useToast } from "./use-toast";
import useAuth from "./useAuth";
import { INotification } from "@/@types/Notification";

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

    const isAdmin = user.role === "admin";
    const userId = user._id;

    // Initialize socket connection với query params phù hợp
    const queryParams: { isAdmin?: string; userId?: string } = {};

    if (isAdmin) {
      queryParams.isAdmin = "true";
    } else {
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
      console.log("Socket connected");

      // Join room tương ứng với role
      if (isAdmin) {
        socketRef.current?.emit("join_room", "admin");
        console.log("Joined admin room");
      } else {
        // Employee join vào room user:userId
        socketRef.current?.emit("join_room", `user:${userId}`);
        console.log(`Joined user room: user:${userId}`);
      }
    });

    socketRef.current.on("disconnect", () => {
      console.log("Socket disconnected");
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
  };
};
