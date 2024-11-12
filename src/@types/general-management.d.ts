type RoomType = {
  _id: string;
  name: string;
  description?: string;
};

type RoomTypeResponse = {
  result: {
    data: RoomType[];
    totalPage: number;
  };
  message: string;
};
