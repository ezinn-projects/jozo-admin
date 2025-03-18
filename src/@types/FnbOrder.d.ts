interface FNBOrder {
  drinks: Record<string, number>;
  snacks: Record<string, number>;
}

interface IFnbOrder {
  _id?: string;
  roomScheduleId: string; // Khóa ngoại tham chiếu đến RoomSchedule._id
  order: FNBOrder;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export type { IFnbOrder, FNBOrder };
