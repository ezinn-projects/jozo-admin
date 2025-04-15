import { useEffect, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { useToast } from "./use-toast";

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
    });

    // Setup reconnection handling
    socketRef.current.on("connect", () => {
      console.log("Socket connected");
      // Automatically join admin room when connected
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

  return {
    socket: socketRef.current,
    joinRoom,
    leaveRoom,
    onNotification,
    offNotification,
  };
};
