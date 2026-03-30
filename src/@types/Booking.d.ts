interface IBookingPayload {
  bookingId?: string;
  _id?: string;
  roomId: string;
  roomName?: string;
  roomType?: string;
  originalRequest?: string;
  upgraded?: boolean;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  startTime: string;
  endTime: string;
  note?: string;
  source?: string;
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
  createdBy?: string;
  actualEndTime?: string | null;
  newRoomId?: string;
  roomChangeNote?: string;
  cancelledAt?: string;
  action?: string;
}

interface IBookingSocketData extends IBookingPayload {
  roomId: string;
  booking?: IBookingPayload;
  [key: string]: unknown;
}

export type { IBookingPayload, IBookingSocketData };
