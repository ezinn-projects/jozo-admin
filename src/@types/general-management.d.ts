type RoomType = {
  _id: string;
  name: string;
  description?: string;
};

type Pricing = {
  _id: string;
  room_size: string;
  day_type: string;
  time_range: string | null;
  price: number;
  effective_date: string;
  end_date: string | null;
  note: string | null;
};

type RoomTypeResponse = HTTPResponse<RoomType>;
type PricingResponse = HTTPResponse<Pricing[]>;
