import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSocket } from "@/hooks/useSocket";
import { Gift as GiftType } from "@/@types/Gift";
import { IBookingSocketData } from "@/@types/Booking";
import { OrderData } from "@/pages/RoomSchedule/components/RoomTimelineTable";
import { useToast } from "@/hooks/use-toast";
import dayjs from "dayjs";
import { useQueryClient } from "@tanstack/react-query";

type SupportNotification = {
  roomId: string;
  message: string;
  timestamp: number;
};

type OrderNotificationState = {
  roomId: string;
  message: string;
  timestamp: number;
  orderData: OrderData;
};

type GiftNotificationState = {
  roomId: string;
  scheduleId: string;
  gift: GiftType;
  timestamp: number;
};

type SupportNotificationsMap = Record<string, SupportNotification>;
type OrderNotificationsMap = Record<string, OrderNotificationState>;
type GiftNotificationsMap = Record<string, GiftNotificationState>;

type BlinkingMap = Record<string, boolean>;

interface RoomEventsContextValue {
  supportNotifications: SupportNotificationsMap;
  orderNotifications: OrderNotificationsMap;
  giftNotifications: GiftNotificationsMap;
  blinkingSupportRooms: BlinkingMap;
  blinkingOrderRooms: BlinkingMap;
  blinkingGiftRooms: BlinkingMap;
  clearSupportNotification: (roomId: string) => void;
  clearOrderNotification: (roomId: string) => void;
  clearGiftNotification: (roomId: string) => void;
}

const RoomEventsContext = createContext<RoomEventsContextValue | undefined>(
  undefined,
);

interface RoomEventsProviderProps {
  children: React.ReactNode;
}

export const RoomEventsProvider: React.FC<RoomEventsProviderProps> = ({
  children,
}) => {
  const {
    joinRoom,
    leaveRoom,
    onNotification,
    offNotification,
    onNewOrderNotification,
    offNewOrderNotification,
    onNewBooking,
    offNewBooking,
    onGiftClaimed,
    offGiftClaimed,
  } = useSocket();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [supportNotifications, setSupportNotifications] =
    useState<SupportNotificationsMap>({});
  const [orderNotifications, setOrderNotifications] =
    useState<OrderNotificationsMap>({});
  const [giftNotifications, setGiftNotifications] =
    useState<GiftNotificationsMap>({});

  const [blinkingSupportRooms, setBlinkingSupportRooms] = useState<BlinkingMap>(
    {},
  );
  const [blinkingOrderRooms, setBlinkingOrderRooms] = useState<BlinkingMap>({});
  const [blinkingGiftRooms, setBlinkingGiftRooms] = useState<BlinkingMap>({});

  // Text-to-speech cho toàn app: dùng Web Speech API (tts có sẵn trong trình duyệt)
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      console.warn("Web Speech API not supported");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "vi-VN";
    utterance.rate = 1;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const vietnameseVoice = voices.find((voice) =>
      voice.lang?.toLowerCase().startsWith("vi"),
    );
    if (vietnameseVoice) {
      utterance.voice = vietnameseVoice;
    }

    // Dừng đọc cũ (nếu có) rồi đọc mới
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, []);

  const clearSupportNotification = useCallback((roomId: string) => {
    setSupportNotifications((prev) => {
      const next = { ...prev };
      delete next[roomId];
      return next;
    });
    setBlinkingSupportRooms((prev) => ({
      ...prev,
      [roomId]: false,
    }));
  }, []);

  const clearOrderNotification = useCallback((roomId: string) => {
    setOrderNotifications((prev) => {
      const next = { ...prev };
      delete next[roomId];
      return next;
    });
    setBlinkingOrderRooms((prev) => ({
      ...prev,
      [roomId]: false,
    }));
  }, []);

  const clearGiftNotification = useCallback((roomId: string) => {
    setGiftNotifications((prev) => {
      const next = { ...prev };
      delete next[roomId];
      return next;
    });
    setBlinkingGiftRooms((prev) => ({
      ...prev,
      [roomId]: false,
    }));
  }, []);

  // Socket subscription & room joining
  useEffect(() => {
    // Admin room để nhận booking/support/order/gift chung
    joinRoom("admin");

    const handleNotification = (data: { roomId: string; message: string }) => {
      const roomId = data.roomId;

      setSupportNotifications((prev) => ({
        ...prev,
        [roomId]: {
          roomId,
          message: data.message,
          timestamp: Date.now(),
        },
      }));

      setBlinkingSupportRooms((prev) => ({
        ...prev,
        [roomId]: true,
      }));

      // Tự tắt nháy sau 15s (nhưng vẫn giữ notification để admin mở màn vẫn thấy)
      setTimeout(() => {
        setBlinkingSupportRooms((prev) => ({
          ...prev,
          [roomId]: false,
        }));
      }, 15000);

      // Toast + voice global
      toast({
        title: "Yêu cầu hỗ trợ mới",
        description: `Phòng ${roomId}: ${data.message}`,
      });
      speak(`Phòng ${roomId} ${data.message}`);
    };

    const handleNewOrderNotification = (data: {
      type: string;
      roomId: string;
      message: string;
      timestamp: number;
      orderData: OrderData;
    }) => {
      if (data.type !== "new_order") return;

      const roomId = data.roomId;

      setOrderNotifications((prev) => ({
        ...prev,
        [roomId]: {
          roomId,
          message: data.message,
          timestamp: data.timestamp,
          orderData: data.orderData,
        },
      }));

      setBlinkingOrderRooms((prev) => ({
        ...prev,
        [roomId]: true,
      }));

      setTimeout(() => {
        setBlinkingOrderRooms((prev) => ({
          ...prev,
          [roomId]: false,
        }));
      }, 30000);

      toast({
        title: "Đơn hàng mới",
        description: `Phòng ${roomId}: ${data.message}`,
      });
      speak(`Đơn hàng mới từ phòng ${roomId}`);
    };

    const handleGiftClaimed = (data: {
      roomId: string;
      scheduleId: string;
      gift: GiftType;
    }) => {
      const roomId = data.roomId;

      setGiftNotifications((prev) => ({
        ...prev,
        [roomId]: {
          roomId,
          scheduleId: data.scheduleId,
          gift: data.gift,
          timestamp: Date.now(),
        },
      }));

      setBlinkingGiftRooms((prev) => ({
        ...prev,
        [roomId]: true,
      }));

      setTimeout(() => {
        setBlinkingGiftRooms((prev) => ({
          ...prev,
          [roomId]: false,
        }));
      }, 30000);

      toast({
        title: "Quà tặng đã được nhận",
        description: `Phòng ${roomId}: ${data.gift.name}`,
      });
      speak(`Quà tặng đã được nhận tại phòng ${roomId}`);
    };

    const handleNewBooking = (data: IBookingSocketData) => {
      const bookingData = data.booking;
      const roomId = data.roomId;

      if (!bookingData || !roomId) return;

      const bookingDate = dayjs(bookingData.startTime);

      // Cache key giống RoomTimeline dùng
      const queryKey = [
        "roomSchedules",
        bookingDate.startOf("day").toISOString(),
      ];

      // Chỉ cập nhật cache, không phụ thuộc việc đang đứng ở màn timeline hay không
      queryClient.setQueryData(queryKey, (oldData: unknown): unknown => {
        const old = (oldData || []) as Array<{
          _id: string;
        }>;

        const exists = old.some((s) => s._id === bookingData.bookingId);
        if (exists) return oldData;

        // Để tránh lệ thuộc type IRoomSchedule ở đây, chỉ invalidates để RoomTimeline tự refetch
        return oldData;
      });

      // Invalidate để RoomTimeline (hoặc nơi khác) tự refetch khi cần
      queryClient.invalidateQueries({ queryKey: ["roomSchedules"] });

      const roomName = bookingData.roomName || roomId;

      switch (bookingData.action) {
        case "booked":
          toast({
            title: "Booking mới",
            description: `${roomName}: Đã được đặt`,
          });
          speak(`Phòng ${roomName} vừa được đặt`);
          break;
        case "cancelled":
          toast({
            title: "Booking đã bị hủy",
            description: `${roomName}: Đã bị hủy`,
            variant: "destructive",
          });
          speak(`Booking của phòng ${roomName} đã bị hủy`);
          break;
        default:
          break;
      }
    };

    onNotification(handleNotification);
    onNewOrderNotification(handleNewOrderNotification);
    onNewBooking(handleNewBooking);
    onGiftClaimed(handleGiftClaimed);

    return () => {
      offNotification(handleNotification);
      offNewOrderNotification(handleNewOrderNotification);
      offNewBooking(handleNewBooking);
      offGiftClaimed(handleGiftClaimed);
      leaveRoom("admin");
    };
  }, [
    joinRoom,
    leaveRoom,
    onNotification,
    offNotification,
    onNewOrderNotification,
    offNewOrderNotification,
    onNewBooking,
    offNewBooking,
    onGiftClaimed,
    offGiftClaimed,
    queryClient,
    toast,
    speak,
  ]);

  // Clear old notifications periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      setSupportNotifications((prev) => {
        const next: SupportNotificationsMap = {};
        Object.entries(prev).forEach(([roomId, notif]) => {
          if (now - notif.timestamp < 5 * 60 * 1000) {
            next[roomId] = notif;
          }
        });
        return next;
      });

      setOrderNotifications((prev) => {
        const next: OrderNotificationsMap = {};
        Object.entries(prev).forEach(([roomId, notif]) => {
          if (now - notif.timestamp < 10 * 60 * 1000) {
            next[roomId] = notif;
          }
        });
        return next;
      });

      setGiftNotifications((prev) => {
        const next: GiftNotificationsMap = {};
        Object.entries(prev).forEach(([roomId, notif]) => {
          if (now - notif.timestamp < 10 * 60 * 1000) {
            next[roomId] = notif;
          }
        });
        return next;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const value = useMemo<RoomEventsContextValue>(
    () => ({
      supportNotifications,
      orderNotifications,
      giftNotifications,
      blinkingSupportRooms,
      blinkingOrderRooms,
      blinkingGiftRooms,
      clearSupportNotification,
      clearOrderNotification,
      clearGiftNotification,
    }),
    [
      supportNotifications,
      orderNotifications,
      giftNotifications,
      blinkingSupportRooms,
      blinkingOrderRooms,
      blinkingGiftRooms,
      clearSupportNotification,
      clearOrderNotification,
      clearGiftNotification,
    ],
  );

  return (
    <RoomEventsContext.Provider value={value}>
      {children}
    </RoomEventsContext.Provider>
  );
};

export const useRoomEvents = (): RoomEventsContextValue => {
  const ctx = useContext(RoomEventsContext);
  if (!ctx) {
    throw new Error("useRoomEvents must be used within RoomEventsProvider");
  }
  return ctx;
};
