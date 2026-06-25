import { ICoffeeSession } from "@/@types/CoffeeSession";
import {
  ICoffeeSessionOrderLine,
  ICoffeeSessionOrderLineItem,
  ICompactCoffeeSessionOrderBatch,
} from "@/@types/CoffeeSessionOrder";
import { ICoffeeTable } from "@/@types/CoffeeTable";
import { Gift as GiftType } from "@/@types/Gift";
import { IRoom, IRoomSchedule } from "@/@types/Room";
import coffeeSessionApis from "@/apis/coffeeSession.apis";
import coffeeTableApis from "@/apis/coffeeTable.apis";
import roomApis from "@/apis/room.apis";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs, { Dayjs } from "dayjs";
import React, { useEffect, useRef, useState } from "react";
// import roomsScheduleApis from "@/apis/roomSchedule.api";
import GiftDetailsModal from "@/components/modules/RoomSchedule/GiftDetailsModal";
import OrderDetailsModal from "@/components/modules/RoomSchedule/OrderDetailsModal";
import ScheduleModal from "@/components/modules/RoomSchedule/ScheduleModal";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RoomType } from "@/constants/enum";
import { useRoomEvents } from "@/context/RoomEventsContext";
import {
  useResolveRequest,
  useRoomSchedules,
  useTurnOffAllRooms,
} from "@/hooks/room-schedule";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsStaff } from "@/hooks/usePermission";
import { useToast } from "@/hooks/use-toast";
import {
  getCoffeeSessionDisplayEnd,
  getCoffeeSessionDisplayStart,
  getCoffeeSessionStatusLabel,
  getCoffeeSessionTableId,
  normalizeCoffeeSessionStatus,
} from "@/utils/coffeeSession";
import {
  BellIcon,
  CalendarIcon,
  CircleXIcon,
  CupSoda,
  DoorOpen,
  Gamepad2,
  Gift,
  ShoppingCart,
  UtensilsCrossed,
} from "lucide-react";
import CoffeeBookedModal from "./CoffeeBookedModal";
import CoffeeCreateSessionModal from "./CoffeeCreateSessionModal";
import CoffeeInUseModal from "./CoffeeInUseModal";
import CoffeeNewOrderLineItemsModal from "./CoffeeNewOrderLineItemsModal";
import ExtendSessionModal from "./ExtendSessionModal";
import MobileTimelineView from "./MobileTimelineView";
import ProcessBookedModal from "./ProcessBookedModal";
import ProcessInUseModal from "./ProcessInUseModal";
import ProcessLockedModal from "./ProcessLockedModal";

const DAY_START_HOUR = 0;
const DAY_END_HOUR = 24;
const HOUR_MARKER_SPACING = 120;
const SCALE = HOUR_MARKER_SPACING / 60;
const TIMELINE_WIDTH =
  HOUR_MARKER_SPACING * (DAY_END_HOUR - DAY_START_HOUR) + 300;
const AUTO_SCROLL_MARKER_VIEWPORT_RATIO = 0.65;

interface GroupedSchedules {
  [roomId: string]: IRoomSchedule[];
}

interface GroupedCoffeeSessions {
  [coffeeTableId: string]: ICoffeeSession[];
}

const groupSchedulesByRoom = (schedules: IRoomSchedule[]): GroupedSchedules =>
  schedules.reduce((acc: GroupedSchedules, schedule) => {
    if (!acc[schedule.roomId]) {
      acc[schedule.roomId] = [];
    }
    acc[schedule.roomId].push(schedule);
    return acc;
  }, {});

const groupCoffeeSessionsByTable = (
  sessions: ICoffeeSession[],
): GroupedCoffeeSessions =>
  sessions.reduce((acc: GroupedCoffeeSessions, session) => {
    const tableId = getCoffeeSessionTableId(session);

    if (!tableId) {
      return acc;
    }

    if (!acc[tableId]) {
      acc[tableId] = [];
    }
    acc[tableId].push(session);
    acc[tableId].sort(
      (a, b) =>
        getCoffeeSessionDisplayStart(a).valueOf() -
        getCoffeeSessionDisplayStart(b).valueOf(),
    );
    return acc;
  }, {});

type Modal =
  | "create"
  | "edit"
  | "delete"
  | "process"
  | "booked"
  | "inUse"
  | "extend"
  | "foodDrink"
  | "bill"
  | "orderDetails"
  | "giftDetails"
  | "coffeeCreate"
  | "coffeeBooked"
  | "coffeeInUse"
  | null;

// interface DragState {
//   isDragging: boolean;
//   scheduleId: string | null;
//   startX: number;
//   startY: number;
//   originalRoomId: string;
//   originalStartTime: string;
//   originalEndTime: string;
// }

interface OrderData {
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
}

export type { OrderData };

const getRoomTypeLabel = (type: RoomType) => {
  switch (type) {
    case RoomType.Medium:
      return "Vừa";
    case RoomType.Large:
      return "Lớn";
    case RoomType.Dorm:
      return "Dorm";
    default:
      return "Vừa";
  }
};

const getRoomTypeLeadIcon = (type: RoomType) => {
  const className = "h-4 w-4 shrink-0 text-slate-500";
  if (type === RoomType.Dorm) {
    return <Gamepad2 className={className} aria-hidden />;
  }
  return <DoorOpen className={className} aria-hidden />;
};

const getTimelineNowMarker = (viewDate: Dayjs, now: Dayjs) => {
  const isToday = viewDate.isSame(now, "day");
  let markerLeft = 0;
  const leftOffset = 240;

  if (isToday) {
    const totalMinutes =
      (now.hour() - DAY_START_HOUR) * 60 + now.minute();
    const clampedMinutes = Math.min(
      Math.max(totalMinutes, 0),
      (DAY_END_HOUR - DAY_START_HOUR) * 60,
    );
    markerLeft = leftOffset + clampedMinutes * SCALE;
  }

  return { isToday, markerLeft };
};

const RoomTimelineTable: React.FC = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const isStaff = useIsStaff();
  const {
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
  } = useRoomEvents();
  const [roomsDate, setRoomsDate] = useState<Dayjs>(dayjs());
  const [coffeeDate, setCoffeeDate] = useState<Dayjs>(dayjs());
  const { data: schedules, isLoading, error, refetch } =
    useRoomSchedules(roomsDate);
  const {
    data: roomsData,
    isLoading: loadingRooms,
    error: roomError,
  } = useQuery({
    queryKey: ["rooms"],
    queryFn: roomApis.getRooms,
    select: (data) => data.data.result as IRoom[],
  });

  const [modal, setModal] = useState<Modal>(null);
  const [selectedRoom, setSelectedRoom] = useState<IRoom | null>(null);
  const [lockedSchedule, setLockedSchedule] = useState<IRoomSchedule | null>(
    null,
  );
  const [bookedSchedule, setBookedSchedule] = useState<IRoomSchedule | null>(
    null,
  );
  const [inUseSchedule, setInUseSchedule] = useState<IRoomSchedule | null>(
    null,
  );
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [orderRoomId, setOrderRoomId] = useState<string>("");
  const [giftData, setGiftData] = useState<{
    gift: GiftType;
    roomId: string;
    scheduleId: string;
  } | null>(null);
  const [coffeeModalTable, setCoffeeModalTable] = useState<ICoffeeTable | null>(
    null,
  );
  const [selectedCoffeeSession, setSelectedCoffeeSession] =
    useState<ICoffeeSession | null>(null);
  const [openCoffeeOrderEditorOnOpen, setOpenCoffeeOrderEditorOnOpen] =
    useState(false);
  const [coffeeNewOrderLineItemsOpen, setCoffeeNewOrderLineItemsOpen] =
    useState(false);
  const [coffeeNewOrderLineItemsCtx, setCoffeeNewOrderLineItemsCtx] = useState<{
    table: ICoffeeTable;
    session: ICoffeeSession;
    lines?: ICoffeeSessionOrderLine[];
    lineItems?: ICoffeeSessionOrderLineItem[];
    summary: string;
    highlightBatchId?: string;
    createdBatch?: ICompactCoffeeSessionOrderBatch;
  } | null>(null);
  const queryClient = useQueryClient();

  const [scheduleViewTab, setScheduleViewTab] = useState<"rooms" | "coffee">(
    "rooms",
  );

  const { data: coffeeTables, isLoading: loadingCoffeeTables } = useQuery({
    queryKey: ["coffeeTables"],
    queryFn: () => coffeeTableApis.getCoffeeTables(),
    select: (data) => (data.data.result ?? []) as ICoffeeTable[],
    enabled: scheduleViewTab === "coffee",
  });
  const {
    data: coffeeSessions,
    isLoading: loadingCoffeeSessions,
    error: coffeeSessionsError,
  } = useQuery({
    queryKey: ["coffeeSessions", coffeeDate.toISOString()],
    queryFn: () =>
      coffeeSessionApis.getCoffeeSessions({
        date: coffeeDate.toISOString(),
      }),
    select: (data) => (data.data.result ?? []) as ICoffeeSession[],
    enabled: scheduleViewTab === "coffee",
  });

  const updateCoffeeTableActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      coffeeTableApis.updateCoffeeTable(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coffeeTables"] });
      toast({
        title: "Đã cập nhật",
        description: "Trạng thái hoạt động của bàn đã được lưu.",
      });
    },
    onError: (mutationError) => {
      toast({
        title: "Không thể cập nhật bàn",
        description: mutationError.message || "Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  // Drag and drop state - TẠM THỜI DISABLED
  /*
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    scheduleId: null,
    startX: 0,
    startY: 0,
    originalRoomId: "",
    originalStartTime: "",
    originalEndTime: "",
  });
  */

  const { mutate: turnOffAllRooms } = useTurnOffAllRooms();

  // Mutation cho việc cập nhật schedule - TẠM THỜI DISABLED
  /*
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
  */

  // Cập nhật currentTime mỗi giây
  const [currentTime, setCurrentTime] = useState(dayjs());
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Ref cho timeline container
  const timelineContainerRef = useRef<HTMLDivElement>(null);

  // State điều khiển auto-scroll
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoScrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isAutoScrollingRef = useRef(false);

  const { mutate: resolveRequest } = useResolveRequest();

  // Handler để tạm dừng auto-scroll khi người dùng scroll
  const handleScroll = () => {
    if (isAutoScrollingRef.current) {
      return;
    }

    setAutoScrollEnabled(false);
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      setAutoScrollEnabled(true);
    }, 5000); // 5 giây không có thao tác thì bật lại auto-scroll
  };

  // Cleanup timer khi unmount
  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (autoScrollTimerRef.current) {
        clearTimeout(autoScrollTimerRef.current);
      }
    };
  }, []);

  const roomsTimeline = getTimelineNowMarker(roomsDate, currentTime);
  const coffeeTimeline = getTimelineNowMarker(coffeeDate, currentTime);
  const { isToday: roomsIsToday, markerLeft: roomsMarkerLeft } = roomsTimeline;
  const { isToday: coffeeIsToday, markerLeft: coffeeMarkerLeft } =
    coffeeTimeline;
  const activeTimeline =
    scheduleViewTab === "coffee" ? coffeeTimeline : roomsTimeline;

  // Auto-scroll effect: canh now marker lệch về bên phải viewport để dễ nhìn phần sắp tới
  useEffect(() => {
    if (
      timelineContainerRef.current &&
      activeTimeline.isToday &&
      autoScrollEnabled
    ) {
      const container = timelineContainerRef.current;
      const currentScrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      const maxScrollLeft = Math.max(container.scrollWidth - containerWidth, 0);
      const targetScrollLeft = Math.min(
        Math.max(
          activeTimeline.markerLeft -
            containerWidth * AUTO_SCROLL_MARKER_VIEWPORT_RATIO,
          0,
        ),
        maxScrollLeft,
      );

      if (Math.abs(currentScrollLeft - targetScrollLeft) > 1) {
        isAutoScrollingRef.current = true;
        container.scrollLeft = targetScrollLeft;

        if (autoScrollTimerRef.current) {
          clearTimeout(autoScrollTimerRef.current);
        }
        autoScrollTimerRef.current = setTimeout(() => {
          isAutoScrollingRef.current = false;
        }, 100);
      }
    }
  }, [
    currentTime,
    activeTimeline.markerLeft,
    activeTimeline.isToday,
    autoScrollEnabled,
    scheduleViewTab,
  ]);

  // Helper: map room._id -> socketRoomId (index+1 as string)
  const getSocketRoomId = (roomId: string): string | null => {
    const idx = roomsData?.findIndex((room) => room._id === roomId) ?? -1;
    if (idx < 0) return null;
    return (idx + 1).toString();
  };

  if (isLoading || loadingRooms) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (roomError) return <div>Error: {roomError.message}</div>;

  const grouped = groupSchedulesByRoom(schedules || []);
  const activeCoffeeSessions = (coffeeSessions || []).filter((session) => {
    const normalizedStatus = normalizeCoffeeSessionStatus(session.status);

    if (!normalizedStatus || normalizedStatus === "completed") {
      return false;
    }

    const start = getCoffeeSessionDisplayStart(session);
    const end = getCoffeeSessionDisplayEnd(session, currentTime);

    return (
      start.isBefore(coffeeDate.endOf("day")) &&
      end.isAfter(coffeeDate.startOf("day"))
    );
  });
  const groupedCoffeeSessions =
    groupCoffeeSessionsByTable(activeCoffeeSessions);

  // Build view-level maps keyed by room._id for mobile/desktop UI
  const viewNotifications: {
    [roomId: string]: { message: string; timestamp: number };
  } = {};
  const viewBlinkingRooms: { [roomId: string]: boolean } = {};
  const viewOrderNotifications: {
    [roomId: string]: {
      message: string;
      timestamp: number;
      orderData: OrderData;
    };
  } = {};
  const viewOrderBlinkingRooms: { [roomId: string]: boolean } = {};
  const viewGiftNotifications: {
    [roomId: string]: { gift: GiftType; scheduleId: string; timestamp: number };
  } = {};
  const viewGiftBlinkingRooms: { [roomId: string]: boolean } = {};

  roomsData?.forEach((room, index) => {
    const socketRoomId = (index + 1).toString();

    const support = supportNotifications[socketRoomId];
    if (support) {
      viewNotifications[room._id] = {
        message: support.message,
        timestamp: support.timestamp,
      };
      viewBlinkingRooms[room._id] = !!blinkingSupportRooms[socketRoomId];
    }

    const order = orderNotifications[socketRoomId];
    if (order) {
      viewOrderNotifications[room._id] = {
        message: order.message,
        timestamp: order.timestamp,
        orderData: order.orderData,
      };
      viewOrderBlinkingRooms[room._id] = !!blinkingOrderRooms[socketRoomId];
    }

    const gift = giftNotifications[socketRoomId];
    if (gift) {
      viewGiftNotifications[room._id] = {
        gift: gift.gift,
        scheduleId: gift.scheduleId,
        timestamp: gift.timestamp,
      };
      viewGiftBlinkingRooms[room._id] = !!blinkingGiftRooms[socketRoomId];
    }
  });

  const handleRoomClick = (roomId: string) => {
    const foundRoom = roomsData?.find((room) => room._id === roomId);
    if (foundRoom) {
      setSelectedRoom(foundRoom);
      setModal("create");
      // Stop blinking when clicked
      const socketRoomId = getSocketRoomId(roomId);
      if (socketRoomId) {
        clearSupportNotification(socketRoomId);
      }
    }
  };

  const closeModal = () => {
    setModal(null);
    setSelectedRoom(null);
    setLockedSchedule(null);
    setBookedSchedule(null);
    setInUseSchedule(null);
    setOrderData(null);
    setOrderRoomId("");
    setGiftData(null);
    setCoffeeModalTable(null);
    setSelectedCoffeeSession(null);
    setOpenCoffeeOrderEditorOnOpen(false);
    setCoffeeNewOrderLineItemsOpen(false);
    setCoffeeNewOrderLineItemsCtx(null);
  };

  const handleOrderClick = (roomId: string) => {
    const socketRoomId = getSocketRoomId(roomId);
    if (!socketRoomId) return;
    const orderNotification = orderNotifications[socketRoomId];
    if (orderNotification) {
      setOrderData(orderNotification.orderData);
      setOrderRoomId(roomId);
      setModal("orderDetails");
      // Stop blinking when clicked
      clearOrderNotification(socketRoomId);
    }
  };

  const handleOrderServed = (roomId: string) => {
    // Remove order notification after served
    const socketRoomId = getSocketRoomId(roomId);
    if (socketRoomId) {
      clearOrderNotification(socketRoomId);
    }
  };

  const handleGiftClick = (roomId: string) => {
    const socketRoomId = getSocketRoomId(roomId);
    if (!socketRoomId) return;
    const giftNotification = giftNotifications[socketRoomId];
    if (giftNotification) {
      setGiftData({
        gift: giftNotification.gift,
        roomId,
        scheduleId: giftNotification.scheduleId,
      });
      setModal("giftDetails");
      // Stop blinking when clicked
      clearGiftNotification(socketRoomId);
    }
  };

  const handleScheduleClick = (schedule: IRoomSchedule) => {
    const lowerStatus = schedule.status.toLowerCase();
    if (lowerStatus === "locked") {
      setLockedSchedule(schedule);
      setModal("process");
    } else if (lowerStatus === "booked") {
      setBookedSchedule(schedule);
      setModal("booked");
    } else if (lowerStatus === "in use") {
      setInUseSchedule(schedule);
      setModal("inUse");
    }
  };

  const handleCoffeeEmptySlotClick = (table: ICoffeeTable) => {
    if (!table.isActive) {
      toast({
        title: "Bàn đang tạm tắt",
        description: "Hãy bật bàn trước khi tạo coffee session.",
        variant: "destructive",
      });
      return;
    }

    setCoffeeModalTable(table);
    setOpenCoffeeOrderEditorOnOpen(false);
    setModal("coffeeCreate");
  };

  const handleCoffeeSessionClick = (
    table: ICoffeeTable,
    session: ICoffeeSession,
  ) => {
    const normalizedStatus = normalizeCoffeeSessionStatus(session.status);

    setCoffeeModalTable(table);
    setSelectedCoffeeSession(session);
    setOpenCoffeeOrderEditorOnOpen(false);

    if (normalizedStatus === "booked") {
      setModal("coffeeBooked");
    } else if (normalizedStatus === "in-use") {
      setModal("coffeeInUse");
    }
  };

  const closeCoffeeNewOrderLineItemsModal = () => {
    setCoffeeNewOrderLineItemsOpen(false);
    setCoffeeNewOrderLineItemsCtx(null);
  };

  const handleOpenCoffeeSessionFromNewOrderPreview = () => {
    if (!coffeeNewOrderLineItemsCtx) return;
    const { table, session } = coffeeNewOrderLineItemsCtx;
    setCoffeeModalTable(table);
    setSelectedCoffeeSession(session);
    setOpenCoffeeOrderEditorOnOpen(true);

    const normalizedStatus = normalizeCoffeeSessionStatus(session.status);
    if (normalizedStatus === "booked") {
      setModal("coffeeBooked");
      return;
    }
    setModal("coffeeInUse");
  };

  const handleCoffeeNewOrderClick = (
    table: ICoffeeTable,
    tableSessions: ICoffeeSession[],
  ) => {
    const tableCode = String(table.code || "").trim();
    if (!tableCode) return;

    const notification = coffeeNewOrderNotifications[tableCode];
    if (!notification) return;

    const targetSession =
      tableSessions.find(
        (session) => session._id === notification.coffeeSessionId,
      ) ||
      (coffeeSessions || []).find(
        (session) => session._id === notification.coffeeSessionId,
      );

    if (!targetSession) {
      toast({
        title: "Không tìm thấy phiên",
        description:
          "Phiên coffee của đơn mới không còn hoạt động. Đã đóng thông báo.",
      });
      clearCoffeeNewOrderNotification(tableCode);
      return;
    }

    setCoffeeNewOrderLineItemsCtx({
      table,
      session: targetSession,
      lines: notification.lines,
      lineItems: notification.lineItems,
      summary: notification.message,
      highlightBatchId: notification.createdBatch?.batchId,
      createdBatch: notification.createdBatch,
    });
    setCoffeeNewOrderLineItemsOpen(true);
  };

  // Hàm tính toán vị trí và chiều rộng của một event block
  const getMarkerStyle = (schedule: IRoomSchedule) => {
    const eventStart = dayjs(schedule.startTime);
    const dayStart = eventStart.startOf("day").hour(DAY_START_HOUR).minute(0);
    let offsetMinutes = eventStart.diff(dayStart, "minute");
    if (offsetMinutes < 0) offsetMinutes = 0;

    let durationMinutes = 0;
    const status = schedule.status.toLowerCase();
    if (status === "booked") {
      durationMinutes = schedule.endTime
        ? dayjs(schedule.endTime).diff(eventStart, "minute")
        : 120;
    } else if (status === "locked") {
      durationMinutes = schedule.endTime
        ? dayjs(schedule.endTime).diff(eventStart, "minute")
        : 5;
    } else if (status === "maintenance") {
      durationMinutes = schedule.endTime
        ? dayjs(schedule.endTime).diff(eventStart, "minute")
        : 240;
    } else if (status === "in use") {
      if (schedule.endTime) {
        const eventEnd = dayjs(schedule.endTime);
        durationMinutes = eventEnd.diff(eventStart, "minute");
      } else {
        // Nếu chưa có endTime, kéo dài đến currentTime hoặc đến hết ngày (24h)
        const endOfDay = eventStart.startOf("day").hour(DAY_END_HOUR).minute(0);
        const now = dayjs();
        // Nếu currentTime <= endOfDay thì lấy currentTime, còn nếu đã qua 24h thì lấy endOfDay
        const actualEnd = now.isBefore(endOfDay) ? now : endOfDay;
        durationMinutes = actualEnd.diff(eventStart, "minute");
        if (durationMinutes <= 0) durationMinutes = 1;
      }
    }

    const left = offsetMinutes * SCALE;
    let width = durationMinutes * SCALE;
    if (left + width > TIMELINE_WIDTH) {
      width = TIMELINE_WIDTH - left;
    }

    let bgColor = "";
    if (status === "booked") {
      // Nếu source là customer thì màu cam, còn lại màu xanh dương
      if (schedule.source === "customer") {
        bgColor = "bg-orange-500";
      } else {
        bgColor = "bg-blue-500";
      }
    } else if (status === "locked") {
      bgColor = "bg-orange-500";
    } else if (status === "in use") {
      if (schedule.endTime && dayjs(schedule.endTime).isAfter(currentTime)) {
        bgColor = "bg-green-300";
      } else {
        bgColor = "bg-green-500";
      }
    } else if (status === "maintenance") {
      bgColor = "bg-gray-500";
    } else {
      bgColor = "bg-gray-300";
    }

    // Nếu sự kiện đã hoàn toàn nằm bên trái now marker (đã qua) thì thay đổi màu thành sắc đậm hơn
    if (roomsIsToday && roomsMarkerLeft >= left + width) {
      if (status === "booked") {
        // Nếu source là customer thì màu cam đậm, còn lại màu xanh dương đậm
        if (schedule.source === "customer") {
          bgColor = "bg-orange-700";
        } else {
          bgColor = "bg-blue-700";
        }
      } else if (status === "locked") {
        bgColor = "bg-orange-700";
      } else if (status === "in use") {
        bgColor = "bg-green-700";
      } else if (status === "maintenance") {
        bgColor = "bg-gray-700";
      } else {
        bgColor = "bg-gray-500";
      }
    }

    return { left, width, bgColor };
  };

  const getCoffeeMarkerStyle = (session: ICoffeeSession) => {
    const eventStart = getCoffeeSessionDisplayStart(session);
    const eventEnd = getCoffeeSessionDisplayEnd(session, currentTime);
    const dayStart = coffeeDate.startOf("day").hour(DAY_START_HOUR).minute(0);
    const totalTimelineMinutes = (DAY_END_HOUR - DAY_START_HOUR) * 60;

    let offsetMinutes = eventStart.diff(dayStart, "minute");
    let durationMinutes = Math.max(15, eventEnd.diff(eventStart, "minute"));

    if (offsetMinutes < 0) {
      durationMinutes += offsetMinutes;
      offsetMinutes = 0;
    }

    if (offsetMinutes > totalTimelineMinutes) {
      offsetMinutes = totalTimelineMinutes;
      durationMinutes = 15;
    }

    durationMinutes = Math.min(
      Math.max(durationMinutes, 15),
      totalTimelineMinutes - offsetMinutes,
    );

    const left = offsetMinutes * SCALE;
    const width = Math.max(durationMinutes * SCALE, 30);
    const status = normalizeCoffeeSessionStatus(session.status);
    let bgColor = "bg-slate-400";

    if (status === "booked") {
      bgColor = "bg-amber-500";
    } else if (status === "in-use") {
      bgColor = "bg-emerald-500";
    }

    if (coffeeIsToday && coffeeMarkerLeft >= left + width) {
      if (status === "booked") {
        bgColor = "bg-amber-700";
      } else if (status === "in-use") {
        bgColor = "bg-emerald-700";
      }
    }

    return { left, width, bgColor, eventStart, eventEnd };
  };

  const handleResolveRequest = (roomId: string) => {
    const roomIndex =
      roomsData?.findIndex((room) => room._id === roomId) || 0 + 1 + "";

    resolveRequest(roomIndex.toString(), {
      onSuccess: () => {
        // Remove notification for this room
        const socketRoomId = getSocketRoomId(roomId);
        if (socketRoomId) {
          clearSupportNotification(socketRoomId);
        }

        toast({
          title: "Success",
          description: "Request resolved successfully",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to resolve request",
          variant: "destructive",
        });
      },
    });
  };

  const handleTurnOffAllRooms = () => {
    turnOffAllRooms(undefined, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "All rooms turned off",
        });
      },
    });
  };

  return (
    <div className="!p-4 w-full space-y-6">
      <PageHeader
        title="Room Schedules Timeline"
        description="Track room schedules and manage bookings"
        icon={CalendarIcon}
      />

      <Tabs
        value={scheduleViewTab}
        onValueChange={(v) => setScheduleViewTab(v as "rooms" | "coffee")}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="rooms">Box + Dorm</TabsTrigger>
          <TabsTrigger value="coffee">Coffee table</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="mt-4 space-y-6">
          {/* Header: Chọn ngày */}
          <div className="flex justify-end items-start">
            <Popover modal={true}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[240px] pl-3 text-left font-normal"
                >
                  {roomsDate
                    ? roomsDate.format("DD/MM/YYYY")
                    : "Pick a date"}
                  {roomsDate ? (
                    <CircleXIcon
                      className="ml-auto h-4 w-4 opacity-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRoomsDate(dayjs());
                      }}
                    />
                  ) : (
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={roomsDate?.toDate()}
                  onSelect={(newDate) =>
                    newDate && setRoomsDate(dayjs(newDate))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          {/* Thêm button để tắt video hết các trong các phòng */}
          <div className="flex justify-end mb-4">
            <Button variant="destructive" onClick={handleTurnOffAllRooms}>
              Tắt video tất cả phòng
            </Button>
          </div>

          {/* Mobile View */}
          {isMobile ? (
            <MobileTimelineView
              roomsData={roomsData || []}
              grouped={grouped}
              date={roomsDate}
              currentTime={currentTime}
              isToday={roomsIsToday}
              notifications={viewNotifications}
              blinkingRooms={viewBlinkingRooms}
              orderNotifications={viewOrderNotifications}
              orderBlinkingRooms={viewOrderBlinkingRooms}
              giftNotifications={viewGiftNotifications}
              giftBlinkingRooms={viewGiftBlinkingRooms}
              onRoomClick={handleRoomClick}
              onScheduleClick={handleScheduleClick}
              onResolveRequest={handleResolveRequest}
              onOrderClick={handleOrderClick}
              onGiftClick={handleGiftClick}
            />
          ) : (
            /* Desktop View - Container cho phép scroll ngang, thêm onScroll để bắt sự kiện scroll */
            <div
              className="overflow-x-auto"
              ref={timelineContainerRef}
              onScroll={handleScroll}
            >
              {/* Timeline container */}
              <div
                className="relative"
                style={{ width: `${TIMELINE_WIDTH}px` }}
              >
                {/* Timeline Header */}
                <div
                  className="flex border-b bg-gray-200 w-full"
                  style={{ position: "sticky", top: 0, zIndex: 20 }}
                >
                  <div className="w-[240px] p-2 border-r flex items-center justify-center font-medium bg-gray-200">
                    Phòng
                  </div>
                  <div className="flex-1 relative h-10">
                    {Array.from({
                      length: (DAY_END_HOUR - DAY_START_HOUR) * 4 + 1,
                    }).map((_, index) => {
                      const left = index * (HOUR_MARKER_SPACING / 4);
                      return (
                        <div
                          key={`grid-${index}`}
                          className={`absolute h-full w-px ${
                            index % 4 === 0 ? "bg-gray-300" : "bg-gray-200"
                          }`}
                          style={{ left }}
                        />
                      );
                    })}
                    {Array.from({
                      length: DAY_END_HOUR - DAY_START_HOUR + 1,
                    }).map((_, index) => {
                      const hour = DAY_START_HOUR + index;
                      const left = index * HOUR_MARKER_SPACING;
                      return (
                        <div
                          key={`header-marker-${hour}`}
                          className="absolute top-1/2 -translate-y-1/2 text-xs text-gray-600 text-center font-medium"
                          style={{ left, width: 20 }}
                        >
                          {hour}:00
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Now Marker (line đỏ) */}
                {roomsIsToday &&
                  roomsMarkerLeft >= 0 &&
                  roomsMarkerLeft <= TIMELINE_WIDTH && (
                  <>
                    <div
                      className="absolute z-20"
                      style={{
                        left: roomsMarkerLeft - 18,
                        top: "50%",
                        transform: "translateY(-50%)",
                      }}
                    >
                      <div className="text-xs text-red-500 bg-white px-1 rounded">
                        {currentTime.format("HH:mm")}
                      </div>
                    </div>
                    <div
                      className="absolute bg-red-500 w-px"
                      style={{
                        left: roomsMarkerLeft,
                        top: 0,
                        bottom: 0,
                        zIndex: 10,
                      }}
                    />
                  </>
                )}

                {/* Danh sách phòng */}
                {roomsData?.map((room, index) => {
                  const roomSchedules = grouped[room._id] || [];
                  const socketRoomId = (index + 1).toString();
                  const hasNotification = supportNotifications[socketRoomId];
                  const isBlinking = !!blinkingSupportRooms[socketRoomId];
                  const hasOrderNotification = orderNotifications[socketRoomId];
                  const isOrderBlinking = !!blinkingOrderRooms[socketRoomId];
                  const giftNotification = giftNotifications[socketRoomId];
                  const giftSchedule = giftNotification
                    ? roomSchedules.find(
                        (s) => s._id === giftNotification.scheduleId,
                      )
                    : undefined;
                  const giftStatus = giftSchedule?.status?.toLowerCase();
                  const showGiftNotification =
                    !!giftNotification &&
                    !["cancelled", "finished", "completed"].includes(
                      giftStatus || "",
                    );
                  const isGiftBlinking =
                    showGiftNotification && viewGiftBlinkingRooms[room._id];

                  // Tìm schedule có gift nhưng chưa finished
                  const scheduleWithGift = roomSchedules.find((schedule) => {
                    const scheduleGift = (
                      schedule as IRoomSchedule & { gift?: GiftType }
                    )?.gift;
                    const status = schedule.status?.toLowerCase();
                    return (
                      scheduleGift &&
                      status !== "finished" &&
                      status !== "cancelled" &&
                      status !== "completed"
                    );
                  });
                  const scheduleGiftInfo = scheduleWithGift
                    ? (scheduleWithGift as IRoomSchedule & { gift?: GiftType })
                        ?.gift
                    : null;

                  return (
                    <div
                      key={room._id}
                      className="flex border-b hover:bg-gray-50 w-full transition-colors duration-200"
                      // onDragOver={handleDragOver}
                      // onDragLeave={handleDragLeave}
                      // onDrop={(e) => handleDrop(e, room._id)}
                    >
                      <div className="w-[240px] p-2 border-r flex items-center justify-between sticky left-0 z-10 bg-white">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRoomClick(room._id)}
                            className={`inline-flex items-center gap-1.5 text-blue-600 hover:underline ${
                              isBlinking
                                ? "animate-[blink_1s_ease-in-out_infinite]"
                                : ""
                            }`}
                          >
                            {getRoomTypeLeadIcon(room.roomType)}
                            {room.roomName}
                          </button>
                          <span className="text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded">
                            {getRoomTypeLabel(room.roomType)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasNotification && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleResolveRequest(room._id)}
                                >
                                  <BellIcon className="h-5 w-5 text-red-500 animate-bounce" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{hasNotification.message}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {dayjs(hasNotification.timestamp).format(
                                    "HH:mm",
                                  )}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {hasOrderNotification && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleOrderClick(room._id)}
                                  className={`${
                                    isOrderBlinking ? "animate-pulse" : ""
                                  }`}
                                >
                                  <UtensilsCrossed className="h-5 w-5 text-orange-500" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{hasOrderNotification.message}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {scheduleGiftInfo && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Gift className="h-5 w-5 text-purple-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Quà tặng: {scheduleGiftInfo.name}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {showGiftNotification && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleGiftClick(room._id)}
                                  className={`${
                                    isGiftBlinking ? "animate-pulse" : ""
                                  }`}
                                >
                                  <Gift className="h-5 w-5 text-purple-500" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Quà tặng: {giftNotification?.gift.name}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 h-12 relative">
                        {roomsIsToday && (
                          <>
                            {/* Overlay cho vùng đã qua (màu đậm hơn) */}
                            <div
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: roomsMarkerLeft,
                                height: "100%",
                                pointerEvents: "none",
                                zIndex: 0,
                              }}
                            ></div>
                          </>
                        )}
                        {Array.from({
                          length: (DAY_END_HOUR - DAY_START_HOUR) * 4 + 1,
                        }).map((_, index) => {
                          const left = index * (HOUR_MARKER_SPACING / 4);
                          return (
                            <div
                              key={`room-grid-${index}`}
                              className={`absolute h-full w-px ${
                                index % 4 === 0 ? "bg-gray-200" : "bg-gray-100"
                              }`}
                              style={{ left }}
                            />
                          );
                        })}
                        {roomSchedules
                          ?.filter((schedule) => {
                            if (!isStaff) return true;
                            const status = schedule.status.toLowerCase();
                            return (
                              status !== "finished" && status !== "completed"
                            );
                          })
                          .map((schedule) => {
                          const { left, width, bgColor } =
                            getMarkerStyle(schedule);
                          // const isDragging =
                          //   dragState.isDragging &&
                          //   dragState.scheduleId === schedule._id;
                          const eventElement = (
                            <button
                              key={schedule._id}
                              type="button"
                              className={`absolute top-0 bottom-0 my-1.5 ${bgColor} opacity-80 rounded-md shadow-sm hover:opacity-100 transition-all duration-200 hover:shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-500`}
                              style={{ left, width: Math.max(width, 44) }}
                              title={`${schedule.status} - ${dayjs(
                                schedule.startTime,
                              ).format("HH:mm")}`}
                              aria-label={`${room.roomName} ${schedule.status} từ ${dayjs(
                                schedule.startTime,
                              ).format("HH:mm")}`}
                              // draggable
                              // onDragStart={(e) => handleDragStart(e, schedule)}
                              // onDragEnd={handleDragEnd}
                              onClick={() => {
                                const lowerStatus =
                                  schedule.status.toLowerCase();
                                if (lowerStatus === "locked") {
                                  setLockedSchedule(schedule);
                                  setModal("process");
                                } else if (lowerStatus === "booked") {
                                  setBookedSchedule(schedule);
                                  setModal("booked");
                                } else if (lowerStatus === "in use") {
                                  setInUseSchedule(schedule);
                                  setModal("inUse");
                                }
                              }}
                            >
                              {/* Hiển thị thời gian trong schedule block */}
                              <div className="relative flex h-full min-h-9 items-center justify-center px-1.5">
                                <span className="absolute left-1 top-0.5 text-[11px] text-white font-medium leading-none">
                                  {dayjs(schedule.startTime).format("HH:mm")}
                                </span>
                                <span className="max-w-full truncate text-xs sm:text-sm font-semibold text-white">
                                  {room.roomName}
                                </span>
                              </div>
                            </button>
                          );
                          if (schedule.status.toLowerCase() === "booked") {
                            const eventStart = dayjs(schedule.startTime);
                            const eventEnd = schedule.endTime
                              ? dayjs(schedule.endTime)
                              : eventStart.add(120, "minute");
                            return (
                              <Tooltip key={schedule._id}>
                                <TooltipTrigger asChild>
                                  {eventElement}
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Bắt đầu: {eventStart.format("HH:mm")}</p>
                                  <p>Kết thúc: {eventEnd.format("HH:mm")}</p>
                                  {schedule.note && (
                                    <p>Ghi chú: {schedule.note}</p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            );
                          } else if (
                            schedule.status.toLowerCase() === "locked"
                          ) {
                            const lockedDuration = dayjs().diff(
                              dayjs(schedule.startTime),
                              "minute",
                            );
                            return (
                              <Tooltip key={schedule._id}>
                                <TooltipTrigger asChild>
                                  {eventElement}
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Đã khóa {lockedDuration} phút</p>
                                  {/* <p className="text-xs text-gray-500">
                              Kéo để di chuyển
                            </p> */}
                                </TooltipContent>
                              </Tooltip>
                            );
                          } else if (
                            schedule.status.toLowerCase() === "in use"
                          ) {
                            const eventStart = dayjs(schedule.startTime);
                            const inUseDuration = dayjs().diff(
                              eventStart,
                              "minute",
                            );

                            // Tính thời gian đã sử dụng
                            let durationLabel = "";
                            if (inUseDuration < 60) {
                              durationLabel = `${inUseDuration} phút`;
                            } else {
                              const hours = Math.floor(inUseDuration / 60);
                              const minutes = inUseDuration % 60;
                              durationLabel = `${hours} giờ${
                                minutes > 0 ? ` ${minutes} phút` : ""
                              }`;
                            }

                            // Tính giờ kết thúc và thời gian còn lại
                            let endTimeLabel = "";
                            let remainingTimeLabel = "";
                            if (schedule.endTime) {
                              const eventEnd = dayjs(schedule.endTime);
                              endTimeLabel = eventEnd.format("HH:mm");
                              const remainingMinutes = eventEnd.diff(
                                dayjs(),
                                "minute",
                              );
                              if (remainingMinutes > 0) {
                                if (remainingMinutes < 60) {
                                  remainingTimeLabel = `Còn ${remainingMinutes} phút`;
                                } else {
                                  const hours = Math.floor(
                                    remainingMinutes / 60,
                                  );
                                  const minutes = remainingMinutes % 60;
                                  remainingTimeLabel = `Còn ${hours} giờ${
                                    minutes > 0 ? ` ${minutes} phút` : ""
                                  }`;
                                }
                              } else {
                                remainingTimeLabel = "Đã quá giờ";
                              }
                            } else {
                              // Nếu chưa có endTime, tính đến currentTime hoặc endOfDay
                              const endOfDay = eventStart
                                .startOf("day")
                                .hour(DAY_END_HOUR)
                                .minute(0);
                              const now = dayjs();
                              const actualEnd = now.isBefore(endOfDay)
                                ? now
                                : endOfDay;
                              endTimeLabel = actualEnd.format("HH:mm");
                            }

                            // Nguồn đặt
                            const sourceLabel =
                              schedule.source === "customer"
                                ? "Khách đặt online"
                                : schedule.source === "walk-in"
                                  ? "Khách vãng lai"
                                  : "Admin đặt";

                            return (
                              <Tooltip key={schedule._id}>
                                <TooltipTrigger asChild>
                                  {eventElement}
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <div className="space-y-1">
                                    <p className="font-semibold">
                                      Thông tin sử dụng
                                    </p>
                                    <div className="text-sm space-y-0.5">
                                      <p>
                                        <span className="text-gray-500">
                                          Bắt đầu:
                                        </span>{" "}
                                        {eventStart.format("HH:mm")}
                                      </p>
                                      <p>
                                        <span className="text-gray-500">
                                          Kết thúc:
                                        </span>{" "}
                                        {endTimeLabel}
                                      </p>
                                      <p>
                                        <span className="text-gray-500">
                                          Đã sử dụng:
                                        </span>{" "}
                                        {durationLabel}
                                      </p>
                                      {remainingTimeLabel && (
                                        <p>
                                          <span className="text-gray-500">
                                            Thời gian còn lại:
                                          </span>{" "}
                                          <span
                                            className={
                                              remainingTimeLabel ===
                                              "Đã quá giờ"
                                                ? "text-red-500 font-medium"
                                                : ""
                                            }
                                          >
                                            {remainingTimeLabel}
                                          </span>
                                        </p>
                                      )}
                                    </div>
                                    {(schedule.customerName ||
                                      schedule.customerPhone ||
                                      schedule.note) && (
                                      <div className="pt-1 border-t text-sm space-y-0.5">
                                        {schedule.customerName && (
                                          <p>
                                            <span className="text-gray-500">
                                              Khách hàng:
                                            </span>{" "}
                                            {schedule.customerName}
                                          </p>
                                        )}
                                        {schedule.customerPhone && (
                                          <p>
                                            <span className="text-gray-500">
                                              SĐT:
                                            </span>{" "}
                                            {schedule.customerPhone}
                                          </p>
                                        )}
                                        {schedule.note && (
                                          <p>
                                            <span className="text-gray-500">
                                              Ghi chú:
                                            </span>{" "}
                                            <span className="italic">
                                              {schedule.note}
                                            </span>
                                          </p>
                                        )}
                                      </div>
                                    )}
                                    <div className="pt-1 border-t text-xs text-gray-500">
                                      <p>{sourceLabel}</p>
                                      {schedule.upgraded && (
                                        <p className="text-orange-500">
                                          Đã nâng cấp phòng
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            );
                          }
                          return eventElement;
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="coffee" className="mt-4 space-y-6">
          <div className="flex justify-end items-start">
            <Popover modal={true}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[240px] pl-3 text-left font-normal"
                >
                  {coffeeDate
                    ? coffeeDate.format("DD/MM/YYYY")
                    : "Chọn ngày"}
                  {coffeeDate ? (
                    <CircleXIcon
                      className="ml-auto h-4 w-4 opacity-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCoffeeDate(dayjs());
                      }}
                    />
                  ) : (
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={coffeeDate?.toDate()}
                  onSelect={(newDate) =>
                    newDate && setCoffeeDate(dayjs(newDate))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {coffeeSessionsError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {coffeeSessionsError.message}
            </div>
          ) : loadingCoffeeTables || loadingCoffeeSessions ? (
            <div>Loading...</div>
          ) : !coffeeTables?.length ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Chưa có bàn coffee.
            </div>
          ) : (
            <div
              className="overflow-x-auto"
              ref={timelineContainerRef}
              onScroll={handleScroll}
            >
              <div
                className="relative"
                style={{ width: `${TIMELINE_WIDTH}px` }}
              >
                <div
                  className="flex border-b bg-gray-200 w-full"
                  style={{ position: "sticky", top: 0, zIndex: 20 }}
                >
                  <div className="w-[240px] p-2 border-r flex items-center justify-center font-medium bg-gray-200">
                    Bàn coffee
                  </div>
                  <div className="flex-1 relative h-10">
                    {Array.from({
                      length: (DAY_END_HOUR - DAY_START_HOUR) * 4 + 1,
                    }).map((_, index) => {
                      const left = index * (HOUR_MARKER_SPACING / 4);
                      return (
                        <div
                          key={`coffee-grid-${index}`}
                          className={`absolute h-full w-px ${
                            index % 4 === 0 ? "bg-gray-300" : "bg-gray-200"
                          }`}
                          style={{ left }}
                        />
                      );
                    })}
                    {Array.from({
                      length: DAY_END_HOUR - DAY_START_HOUR + 1,
                    }).map((_, index) => {
                      const hour = DAY_START_HOUR + index;
                      const left = index * HOUR_MARKER_SPACING;
                      return (
                        <div
                          key={`coffee-header-marker-${hour}`}
                          className="absolute top-1/2 -translate-y-1/2 text-xs text-gray-600 text-center font-medium"
                          style={{ left, width: 20 }}
                        >
                          {hour}:00
                        </div>
                      );
                    })}
                  </div>
                </div>

                {coffeeIsToday &&
                  coffeeMarkerLeft >= 0 &&
                  coffeeMarkerLeft <= TIMELINE_WIDTH && (
                  <>
                    <div
                      className="absolute z-20"
                      style={{
                        left: coffeeMarkerLeft - 18,
                        top: "50%",
                        transform: "translateY(-50%)",
                      }}
                    >
                      <div className="text-xs text-red-500 bg-white px-1 rounded">
                        {currentTime.format("HH:mm")}
                      </div>
                    </div>
                    <div
                      className="absolute bg-red-500 w-px"
                      style={{
                        left: coffeeMarkerLeft,
                        top: 0,
                        bottom: 0,
                        zIndex: 10,
                      }}
                    />
                  </>
                )}

                {coffeeTables.map((table) => {
                  const tableSessions =
                    groupedCoffeeSessions[table._id || ""] || [];
                  const tableCode = String(table.code || "");
                  const coffeeSupportNotification =
                    coffeeSupportNotifications[tableCode];
                  const isCoffeeSupportBlinking =
                    !!blinkingCoffeeSupportTables[tableCode];
                  const coffeeNewOrderNotification =
                    coffeeNewOrderNotifications[tableCode];
                  const isCoffeeNewOrderBlinking =
                    !!blinkingCoffeeNewOrderTables[tableCode];
                  const tableHasBookedOrInUseSession = tableSessions.some(
                    (session) => {
                      const status = normalizeCoffeeSessionStatus(
                        session.status,
                      );
                      return status === "booked" || status === "in-use";
                    },
                  );
                  const isTogglingThisTable =
                    updateCoffeeTableActiveMutation.isPending &&
                    updateCoffeeTableActiveMutation.variables?.id === table._id;

                  return (
                    <div
                      key={table._id}
                      className="flex border-b hover:bg-gray-50 w-full transition-colors duration-200"
                    >
                      <div className="w-[240px] p-2 border-r flex items-center justify-between sticky left-0 z-10 bg-white">
                        <div className="min-w-0">
                          <button
                            className="truncate text-left font-medium text-blue-600 hover:underline"
                            onClick={() => handleCoffeeEmptySlotClick(table)}
                          >
                            {table.name}
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          {coffeeNewOrderNotification && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  aria-label={`Đơn mới bàn ${tableCode}, mở xem món chờ phục vụ`}
                                  className={`flex items-center gap-0.5 ${
                                    isCoffeeNewOrderBlinking
                                      ? "animate-bounce"
                                      : ""
                                  }`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleCoffeeNewOrderClick(
                                      table,
                                      tableSessions,
                                    );
                                  }}
                                >
                                  <ShoppingCart
                                    className="h-5 w-5 shrink-0 text-emerald-600"
                                    aria-hidden
                                  />
                                  <span
                                    className="flex shrink-0 items-center gap-px text-emerald-600"
                                    aria-hidden
                                  >
                                    <UtensilsCrossed className="h-4 w-4" />
                                    <CupSoda className="h-4 w-4" />
                                  </span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-medium">Đơn mới</p>
                                <p className="text-xs text-muted-foreground">
                                  Icon ẩn sau khi phục vụ xong đợt này
                                </p>
                                <p className="text-xs">Bấm để xem / in phiếu</p>
                                <p>{coffeeNewOrderNotification.message}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {dayjs(
                                    coffeeNewOrderNotification.timestamp,
                                  ).format("HH:mm")}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {coffeeSupportNotification && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    clearCoffeeSupportNotification(tableCode);
                                  }}
                                >
                                  <BellIcon
                                    className={`h-5 w-5 text-red-500 ${
                                      isCoffeeSupportBlinking
                                        ? "animate-bounce"
                                        : ""
                                    }`}
                                  />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{coffeeSupportNotification.message}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {dayjs(
                                    coffeeSupportNotification.timestamp,
                                  ).format("HH:mm")}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className="inline-flex items-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Switch
                                  checked={table.isActive}
                                  disabled={
                                    !table._id ||
                                    isTogglingThisTable ||
                                    tableHasBookedOrInUseSession
                                  }
                                  aria-label={`Bàn ${table.name}: ${
                                    table.isActive ? "đang bật" : "đang tắt"
                                  }`}
                                  onCheckedChange={(checked) => {
                                    if (
                                      !table._id ||
                                      tableHasBookedOrInUseSession
                                    ) {
                                      return;
                                    }
                                    updateCoffeeTableActiveMutation.mutate({
                                      id: table._id,
                                      isActive: checked,
                                    });
                                  }}
                                />
                              </span>
                            </TooltipTrigger>
                            {tableHasBookedOrInUseSession ? (
                              <TooltipContent side="left">
                                <p>
                                  Không đổi trạng thái khi bàn đang booked hoặc
                                  đang sử dụng
                                </p>
                              </TooltipContent>
                            ) : (
                              <TooltipContent side="left">
                                <p>
                                  {table.isActive
                                    ? "Tắt bàn (không tạo session mới)"
                                    : "Bật bàn"}
                                </p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </div>
                      </div>

                      <div
                        className="flex-1 h-12 relative cursor-pointer"
                        onClick={() => handleCoffeeEmptySlotClick(table)}
                      >
                        {Array.from({
                          length: (DAY_END_HOUR - DAY_START_HOUR) * 4 + 1,
                        }).map((_, index) => {
                          const left = index * (HOUR_MARKER_SPACING / 4);
                          return (
                            <div
                              key={`coffee-room-grid-${table._id}-${index}`}
                              className={`absolute h-full w-px ${
                                index % 4 === 0 ? "bg-gray-200" : "bg-gray-100"
                              }`}
                              style={{ left }}
                            />
                          );
                        })}

                        {tableSessions.map((session) => {
                          const { left, width, bgColor, eventStart, eventEnd } =
                            getCoffeeMarkerStyle(session);

                          const eventElement = (
                            <div
                              key={session._id}
                              className={`absolute top-0 bottom-0 my-2 rounded shadow-sm ${bgColor} opacity-80 hover:opacity-100 transition-all duration-200 hover:shadow-md`}
                              style={{ left, width }}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleCoffeeSessionClick(table, session);
                              }}
                            >
                              <div className="text-xs text-white font-medium px-1 py-0.5 truncate">
                                {getCoffeeSessionStatusLabel(session.status)}
                              </div>
                            </div>
                          );

                          return (
                            <Tooltip key={session._id}>
                              <TooltipTrigger asChild>
                                {eventElement}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {getCoffeeSessionStatusLabel(session.status)}
                                </p>
                                <p>Bắt đầu: {eventStart.format("HH:mm")}</p>
                                <p>Kết thúc: {eventEnd.format("HH:mm")}</p>
                                {session.customerName && (
                                  <p>Khách: {session.customerName}</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Các modal khác */}
      {modal === "create" && selectedRoom && (
        <ScheduleModal
          isOpen={true}
          onClose={closeModal}
          refetchSchedules={refetch}
          room={selectedRoom}
          selectedDate={roomsDate.toDate()}
        />
      )}
      {modal === "process" && lockedSchedule && (
        <ProcessLockedModal
          isOpen={true}
          onClose={closeModal}
          refetchSchedules={refetch}
          schedule={lockedSchedule}
        />
      )}
      {modal === "booked" && bookedSchedule && (
        <ProcessBookedModal
          isOpen={true}
          onClose={closeModal}
          schedule={bookedSchedule}
          refetchSchedules={refetch}
        />
      )}
      {modal === "inUse" && inUseSchedule && (
        <ProcessInUseModal
          isOpen={true}
          onClose={closeModal}
          schedule={inUseSchedule}
          refetchSchedules={refetch}
          onExtendSession={() => setModal("extend")}
        />
      )}
      {modal === "extend" && inUseSchedule && (
        <ExtendSessionModal
          isOpen={true}
          onClose={closeModal}
          schedule={inUseSchedule}
          refetchSchedules={refetch}
        />
      )}
      {modal === "orderDetails" && orderData && (
        <OrderDetailsModal
          isOpen={true}
          onClose={closeModal}
          orderData={orderData}
          roomId={orderRoomId}
          onOrderServed={() => handleOrderServed(orderRoomId)}
        />
      )}
      {modal === "giftDetails" && giftData && (
        <GiftDetailsModal
          isOpen={true}
          onClose={closeModal}
          gift={giftData.gift}
          roomId={giftData.roomId}
          scheduleId={giftData.scheduleId}
          roomName={roomsData?.find((r) => r._id === giftData.roomId)?.roomName}
        />
      )}
      {modal === "coffeeCreate" && coffeeModalTable && (
        <CoffeeCreateSessionModal
          isOpen={true}
          onClose={closeModal}
          table={coffeeModalTable}
        />
      )}
      {modal === "coffeeBooked" && selectedCoffeeSession && (
        <CoffeeBookedModal
          isOpen={true}
          onClose={closeModal}
          session={selectedCoffeeSession}
          tableName={coffeeModalTable?.name}
        />
      )}
      {modal === "coffeeInUse" && selectedCoffeeSession && (
        <CoffeeInUseModal
          isOpen={true}
          onClose={closeModal}
          session={selectedCoffeeSession}
          tableName={coffeeModalTable?.name}
          tableCode={
            coffeeModalTable?.code != null
              ? String(coffeeModalTable.code).trim()
              : undefined
          }
          defaultOpenOrderEditor={openCoffeeOrderEditorOnOpen}
        />
      )}
      {coffeeNewOrderLineItemsCtx ? (
        <CoffeeNewOrderLineItemsModal
          isOpen={coffeeNewOrderLineItemsOpen}
          onClose={closeCoffeeNewOrderLineItemsModal}
          tableName={coffeeNewOrderLineItemsCtx.table.name}
          coffeeSessionId={coffeeNewOrderLineItemsCtx.session._id || ""}
          summaryMessage={coffeeNewOrderLineItemsCtx.summary}
          initialLines={coffeeNewOrderLineItemsCtx.lines}
          initialLineItems={coffeeNewOrderLineItemsCtx.lineItems}
          highlightBatchId={coffeeNewOrderLineItemsCtx.highlightBatchId}
          initialCreatedBatch={coffeeNewOrderLineItemsCtx.createdBatch}
          onOpenSession={handleOpenCoffeeSessionFromNewOrderPreview}
        />
      ) : null}
    </div>
  );
};

export default RoomTimelineTable;
