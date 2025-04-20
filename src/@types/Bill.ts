export interface IBill {
  _id: string;
  roomId: string;
  roomName: string;
  scheduleId: string;
  paymentMethod: string;
  customer: {
    name: string;
    phoneNumber: string;
  };
  roomPrice: number;
  fnbOrders: Array<{
    _id: string;
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    totalPrice: number;
  }>;
  fnbTotal: number;
  roomTotal: number;
  totalAmount: number;
  startTime: Date;
  endTime: Date;
  actualEndTime: Date;
  createdAt: Date;
  updatedAt: Date;
}
