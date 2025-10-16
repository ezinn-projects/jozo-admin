import { useEffect, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { useToast } from "./use-toast";

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
  const socketRef = useRef<typeof Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      query: {
        isAdmin: true,
      },
      transports: ["websocket"],
    });

    // Setup reconnection handling
    socketRef.current.on("connect", () => {
      socketRef.current?.emit("join_room", "admin");
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
  }, [toast]);

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
  };
};
