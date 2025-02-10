import { RoomType } from "@/constants/enum";

export interface IRoomType {
  _id?: string;
  type: RoomType;
  name: string;
  capacity: number;
  area: number;
  description: string;
  images: string[];
  created_at?: Date;
  updated_at?: Date;
  prices: {
    timeSlot: string;
    price: number;
  }[];
}
