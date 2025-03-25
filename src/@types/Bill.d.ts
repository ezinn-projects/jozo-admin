export interface IBill {
  _id?: string;
  scheduleId: string;
  roomId: string;
  items: Array<{ description: string; price: number; quantity: number }>;
  totalAmount: number;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  paymentMethod: string;
  note?: string;
}

export type { IBill };
