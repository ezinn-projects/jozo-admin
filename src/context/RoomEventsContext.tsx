import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSocket } from "@/hooks/useSocket";
import { Gift as GiftType } from "@/@types/Gift";
import { IBookingSocketData } from "@/@types/Booking";
import { OrderData } from "@/pages/RoomSchedule/components/RoomTimelineTable";
import { useToast } from "@/hooks/use-toast";
import dayjs from "dayjs";
import { useQueryClient } from "@tanstack/react-query";
import {
  COFFEE_ORDER_BOARD_GAME_AUDIO_URLS,
  COFFEE_SUPPORT_BOARD_GAME_AUDIO_URLS,
  ORDER_BOX_AUDIO_URLS,
  SUPPORT_BOX_AUDIO_URLS,
} from "@/constants/supportBoxAudio";
import { ICoffeeOrderNewSocketPayload } from "@/@types/CoffeeSessionOrder";

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

type CoffeeSupportNotification = {
  tableCode: string;
  message: string;
  timestamp: number;
};

type CoffeeSupportNotificationsMap = Record<string, CoffeeSupportNotification>;

type CoffeeNewOrderNotification = {
  tableCode: string;
  tableId: string;
  coffeeSessionId: string;
  orderId: string;
  message: string;
  timestamp: number;
};

type CoffeeNewOrderNotificationsMap = Record<
  string,
  CoffeeNewOrderNotification
>;

interface RoomEventsContextValue {
  supportNotifications: SupportNotificationsMap;
  orderNotifications: OrderNotificationsMap;
  giftNotifications: GiftNotificationsMap;
  blinkingSupportRooms: BlinkingMap;
  blinkingOrderRooms: BlinkingMap;
  blinkingGiftRooms: BlinkingMap;
  coffeeSupportNotifications: CoffeeSupportNotificationsMap;
  blinkingCoffeeSupportTables: BlinkingMap;
  coffeeNewOrderNotifications: CoffeeNewOrderNotificationsMap;
  blinkingCoffeeNewOrderTables: BlinkingMap;
  clearSupportNotification: (roomId: string) => void;
  clearOrderNotification: (roomId: string) => void;
  clearGiftNotification: (roomId: string) => void;
  clearCoffeeSupportNotification: (tableCode: string) => void;
  clearCoffeeNewOrderNotification: (tableCode: string) => void;
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
    onOrderNew,
    offOrderNew,
    onOrderSupportRequested,
    offOrderSupportRequested,
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
  const [coffeeSupportNotifications, setCoffeeSupportNotifications] =
    useState<CoffeeSupportNotificationsMap>({});
  const [blinkingCoffeeSupportTables, setBlinkingCoffeeSupportTables] =
    useState<BlinkingMap>({});
  const [coffeeNewOrderNotifications, setCoffeeNewOrderNotifications] =
    useState<CoffeeNewOrderNotificationsMap>({});
  const [blinkingCoffeeNewOrderTables, setBlinkingCoffeeNewOrderTables] =
    useState<BlinkingMap>({});

  const supportAudioRef = useRef<HTMLAudioElement | null>(null);

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

  /** Phát MP3 theo map key (trim); lỗi / không có URL → TTS fallback. Dùng chung ref với mọi alert âm thanh. */
  const playMappedAlertAudio = useCallback(
    (
      urls: Record<string, string>,
      rawLookupKey: string,
      fallbackSpeakText: string,
    ) => {
      const key = rawLookupKey.trim();
      const url = urls[key];
      if (!url || typeof window === "undefined") {
        speak(fallbackSpeakText);
        return;
      }
      const prev = supportAudioRef.current;
      if (prev) {
        prev.pause();
        prev.currentTime = 0;
      }
      const audio = new Audio(url);
      supportAudioRef.current = audio;
      void audio.play().catch(() => {
        speak(fallbackSpeakText);
      });
    },
    [speak],
  );

  const playSupportBoxAudio = useCallback(
    (socketRoomId: string, fallbackSpeakText: string) =>
      playMappedAlertAudio(
        SUPPORT_BOX_AUDIO_URLS,
        socketRoomId,
        fallbackSpeakText,
      ),
    [playMappedAlertAudio],
  );

  const playCoffeeBoardGameSupportAudio = useCallback(
    (tableCode: string, fallbackSpeakText: string) =>
      playMappedAlertAudio(
        COFFEE_SUPPORT_BOARD_GAME_AUDIO_URLS,
        tableCode,
        fallbackSpeakText,
      ),
    [playMappedAlertAudio],
  );

  const playOrderBoxAudio = useCallback(
    (socketRoomId: string, fallbackSpeakText: string) =>
      playMappedAlertAudio(
        ORDER_BOX_AUDIO_URLS,
        socketRoomId,
        fallbackSpeakText,
      ),
    [playMappedAlertAudio],
  );

  const playCoffeeBoardGameOrderAudio = useCallback(
    (tableCode: string, fallbackSpeakText: string) =>
      playMappedAlertAudio(
        COFFEE_ORDER_BOARD_GAME_AUDIO_URLS,
        tableCode,
        fallbackSpeakText,
      ),
    [playMappedAlertAudio],
  );

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

  const clearCoffeeSupportNotification = useCallback((tableCode: string) => {
    setCoffeeSupportNotifications((prev) => {
      const next = { ...prev };
      delete next[tableCode];
      return next;
    });
    setBlinkingCoffeeSupportTables((prev) => ({
      ...prev,
      [tableCode]: false,
    }));
  }, []);

  const clearCoffeeNewOrderNotification = useCallback((tableCode: string) => {
    setCoffeeNewOrderNotifications((prev) => {
      const next = { ...prev };
      delete next[tableCode];
      return next;
    });
    setBlinkingCoffeeNewOrderTables((prev) => ({
      ...prev,
      [tableCode]: false,
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
      playSupportBoxAudio(roomId, `Phòng ${roomId} ${data.message}`);
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
      playOrderBoxAudio(roomId, `Đơn hàng mới từ phòng ${roomId}`);
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

    const handleOrderNew = (payload: ICoffeeOrderNewSocketPayload) => {
      const tableCodeRaw = payload?.tableCode;
      const doc = payload?.order;
      const innerOrder = payload?.order?.order;

      queryClient.invalidateQueries({ queryKey: ["coffeeSessions"] });

      if (
        tableCodeRaw == null ||
        String(tableCodeRaw).trim() === "" ||
        !innerOrder
      ) {
        return;
      }

      const tableCode = String(tableCodeRaw).trim();
      const sumQty = (rec: Record<string, number> | undefined) =>
        Object.values(rec ?? {}).reduce((acc, n) => acc + (Number(n) || 0), 0);

      const drinkQty = sumQty(innerOrder.drinks);
      const snackQty = sumQty(innerOrder.snacks);
      const parts: string[] = [];
      if (drinkQty > 0) {
        parts.push(drinkQty === 1 ? "1 đồ uống" : `${drinkQty} đồ uống`);
      }
      if (snackQty > 0) {
        parts.push(snackQty === 1 ? "1 món ăn vặt" : `${snackQty} món ăn vặt`);
      }
      const summary = parts.length > 0 ? parts.join(", ") : "Đơn hàng mới";
      const ts =
        typeof payload?.createdAt === "number" &&
        !Number.isNaN(payload?.createdAt)
          ? payload?.createdAt
          : Date.now();

      setCoffeeNewOrderNotifications((prev) => ({
        ...prev,
        [tableCode]: {
          tableCode,
          tableId: String(payload?.tableId ?? ""),
          coffeeSessionId: String(payload?.coffeeSessionId ?? ""),
          orderId: String(doc._id ?? ""),
          message: summary,
          timestamp: ts,
        },
      }));

      setBlinkingCoffeeNewOrderTables((prev) => ({
        ...prev,
        [tableCode]: true,
      }));

      setTimeout(() => {
        setBlinkingCoffeeNewOrderTables((prev) => ({
          ...prev,
          [tableCode]: false,
        }));
      }, 30000);

      toast({
        title: "Đơn hàng coffee mới",
        description: `Bàn ${tableCode}: ${summary}`,
      });
      playCoffeeBoardGameOrderAudio(
        tableCode,
        `Đơn hàng mới từ bàn ${tableCode}, ${summary}`,
      );
    };

    const handleOrderSupportRequested = (payload: unknown) => {
      const p = payload as {
        tableCode?: string;
        note?: string;
        message?: string;
      };
      const rawTableCode = p?.tableCode;
      if (rawTableCode == null || String(rawTableCode).trim() === "") return;

      const tableCode = String(rawTableCode).trim();
      const message = p?.note?.trim() || p?.message?.trim() || "Yêu cầu hỗ trợ";

      setCoffeeSupportNotifications((prev) => ({
        ...prev,
        [tableCode]: {
          tableCode,
          message,
          timestamp: Date.now(),
        },
      }));

      setBlinkingCoffeeSupportTables((prev) => ({
        ...prev,
        [tableCode]: true,
      }));

      setTimeout(() => {
        setBlinkingCoffeeSupportTables((prev) => ({
          ...prev,
          [tableCode]: false,
        }));
      }, 15000);

      queryClient.invalidateQueries({ queryKey: ["coffeeSessions"] });

      toast({
        title: "Yêu cầu hỗ trợ (coffee)",
        description: `Bàn ${tableCode}: ${message}`,
      });
      playCoffeeBoardGameSupportAudio(
        tableCode,
        `Bàn ${tableCode} yêu cầu hỗ trợ`,
      );
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
    onOrderNew(handleOrderNew);
    onOrderSupportRequested(handleOrderSupportRequested);

    return () => {
      offNotification(handleNotification);
      offNewOrderNotification(handleNewOrderNotification);
      offNewBooking(handleNewBooking);
      offGiftClaimed(handleGiftClaimed);
      offOrderNew(handleOrderNew);
      offOrderSupportRequested(handleOrderSupportRequested);
      leaveRoom("management");
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
    onOrderNew,
    offOrderNew,
    onOrderSupportRequested,
    offOrderSupportRequested,
    queryClient,
    toast,
    speak,
    playSupportBoxAudio,
    playCoffeeBoardGameSupportAudio,
    playOrderBoxAudio,
    playCoffeeBoardGameOrderAudio,
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

      setCoffeeSupportNotifications((prev) => {
        const next: CoffeeSupportNotificationsMap = {};
        Object.entries(prev).forEach(([code, notif]) => {
          if (now - notif.timestamp < 5 * 60 * 1000) {
            next[code] = notif;
          }
        });
        return next;
      });

      setCoffeeNewOrderNotifications((prev) => {
        const next: CoffeeNewOrderNotificationsMap = {};
        Object.entries(prev).forEach(([code, notif]) => {
          if (now - notif.timestamp < 10 * 60 * 1000) {
            next[code] = notif;
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
      coffeeSupportNotifications,
      blinkingCoffeeSupportTables,
      coffeeNewOrderNotifications,
      blinkingCoffeeNewOrderTables,
      clearSupportNotification,
      clearOrderNotification,
      clearGiftNotification,
      clearCoffeeSupportNotification,
      clearCoffeeNewOrderNotification,
    }),
    [
      supportNotifications,
      orderNotifications,
      giftNotifications,
      blinkingSupportRooms,
      blinkingOrderRooms,
      blinkingGiftRooms,
      coffeeSupportNotifications,
      blinkingCoffeeSupportTables,
      coffeeNewOrderNotifications,
      blinkingCoffeeNewOrderTables,
      clearSupportNotification,
      clearOrderNotification,
      clearGiftNotification,
      clearCoffeeSupportNotification,
      clearCoffeeNewOrderNotification,
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
