import { RoomStatus, RoomType } from "@/constants/enum";

interface ITimeSlotPrice {
  timeSlot: string;
  price: number;
}

interface ITimeSlot {
  start: string;
  end: string;
  prices: ITimeSlotPrice[];
}

interface IRoom {
  _id?: ObjectId;
  roomId: number;
  roomName: string;
  roomType: RoomType;
  status: RoomStatus; // e.g., AVAILABLE, UNAVAILABLE
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  maxCapacity?: number;
}

interface IRoomSchedule {
  _id: string;
  roomId: string;
  startTime: string;
  endTime: string | null;
  status: RoomStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  actualEndTime: string | null;
  newRoomId?: string;
  roomChangeNote?: string;
  // Customer information
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  // Room upgrade information
  originalRoomType?: string;
  upgraded?: boolean;
  // Booking source
  source?: "customer" | "admin" | "walk-in";
  // Gift enabled
  giftEnabled?: boolean;
  // Free hour promotion
  applyFreeHourPromo?: boolean;
  /** Size khách đặt / đang sử dụng (snapshot, khác room.roomType vật lý) */
  roomType?: RoomType;
}

export type { IRoom, ITimeSlot, ITimeSlotPrice, IRoomSchedule };
