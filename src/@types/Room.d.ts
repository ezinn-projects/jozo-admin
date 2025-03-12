import { DayType, RoomStatus, RoomType } from "@/constants/enum";

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
  _id: string;
  roomName: string;
  roomType: RoomType;
  maxCapacity: number;
  status: DayType;
  description: string;
  images: string[];
  prices: ITimeSlotPrice[];
  createdAt: string;
  updatedAt: string;
}

interface IRoomSchedule {
  _id: string;
  roomId: string;
  startTime: string;
  endTime: string | null;
  status: RoomStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export type { IRoom, ITimeSlot, ITimeSlotPrice, IRoomSchedule };
