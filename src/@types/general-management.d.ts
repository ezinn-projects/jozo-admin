type RoomType = {
  _id: string;
  name: string;
  description?: string;
};

type Pricing = {
  _id?: string;
  room_size: string;
  day_type: string;
  time_range: {
    start: string;
    end: string;
  };
  price: number;
  effective_date: string;
  end_date?: string;
  note?: string;
};

type RoomTypeResponse = HTTPResponse<RoomType>;
type PricingResponse = HTTPResponse<Pricing[]>;
