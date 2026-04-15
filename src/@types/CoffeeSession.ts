export type CoffeeSessionStatus = "booked" | "in-use" | "completed";

export interface ICoffeeSessionPriceSnapshot {
  pricePerPerson?: number;
  currency?: string;
}

export interface ICoffeeSessionPlanSnapshot {
  pricePerPerson?: number;
  peopleCount?: number;
  totalPrice?: number;
  currency?: string;
}

export interface ICoffeeSession {
  _id: string;
  tableId?: string;
  coffeeTableId?: string;
  status: CoffeeSessionStatus | string;
  startTime?: string | null;
  scheduledStartTime?: string | null;
  pinCode?: string | null;
  endTime?: string | null;
  expectedDurationMinutes?: number | null;
  usageDurationMinutes?: number | null;
  note?: string;
  customerName?: string;
  customerPhone?: string;
  peopleCount?: number;
  priceSnapshot?: ICoffeeSessionPriceSnapshot | null;
  planSnapshot?: ICoffeeSessionPlanSnapshot | null;
  pinHash?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  completedBy?: string | null;
}

export interface ICreateCoffeeSessionRequestBody {
  tableId: string;
  note?: string;
  peopleCount?: number;
  scheduledStartTime?: string;
  expectedDurationMinutes?: number;
}

export interface IUpdateCoffeeSessionRequestBody {
  status?: CoffeeSessionStatus;
  note?: string;
  customerName?: string;
  customerPhone?: string;
  peopleCount?: number;
}
