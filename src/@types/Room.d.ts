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
  roomName: string;
  roomType: RoomType;
  status: RoomStatus; // e.g., AVAILABLE, UNAVAILABLE
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
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
}

export type { IRoom, ITimeSlot, ITimeSlotPrice, IRoomSchedule };
