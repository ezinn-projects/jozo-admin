import { DayType, RoomType } from "@/constants/enum";

export type PriceDetail = {
  room_type: RoomType;
  price: number;
};

export type TimeSlot = {
  start: string;
  end: string;
  prices: PriceDetail[];
};

export type Price = {
  _id: string;
  day_type: DayType;
  time_slots: TimeSlot[];
  effective_date: string;
  end_date: string | null;
  note: string | null;
};

export type PricePayload = {
  dayType: DayType;
  timeSlots: {
    start: string;
    end: string;
    prices: {
      roomType: RoomType;
      price: number;
    }[];
  }[];
  effectiveDate: string;
  endDate?: string;
  note?: string;
};

type RoomTypeResponse = HTTPResponse<RoomType[]>;
type PriceResponse = HTTPResponse<Price[]>;
