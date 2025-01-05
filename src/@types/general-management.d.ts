import { DayType, RoomType } from "@/constants/enum";

export type Price = {
  _id: string;
  day_type: DayType;
  time_range: {
    start: string;
    end: string;
  };
  prices: Array<{
    room_type: RoomType;
    price: number;
  }>;
  effective_date: string;
  end_date: string | null;
  note: string | null;
};

type RoomTypeResponse = HTTPResponse<RoomType[]>;
type PriceResponse = HTTPResponse<Price[]>;
