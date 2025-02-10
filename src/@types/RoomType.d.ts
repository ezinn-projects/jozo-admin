import { RoomType } from "@/constants/enum";

export interface IRoomType {
  _id?: string;
  type: RoomType;
  name: string;
  capacity: number;
  area: string;
  description: string;
  images: string[];
  created_at?: Date;
  updated_at?: Date;
  prices: {
    weekday: {
      timeSlot: string;
      price: number;
    }[];
    weekend: {
      timeSlot: string;
      price: number;
    }[];
    holiday: {
      timeSlot: string;
      price: number;
    }[];
  };
}
