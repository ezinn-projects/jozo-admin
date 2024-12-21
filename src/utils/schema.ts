import { DayType } from "@/constants/enum";
import { RoomSize } from "@/constants/enum";
import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Email is invalid" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export const addRoomTypeSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().optional(),
});

export const addPricingSchema = z.object({
  roomSize: z.enum([RoomSize.Small, RoomSize.Medium, RoomSize.Large], {
    errorMap: () => ({ message: "Room size is invalid" }),
  }),
  dayType: z.enum([DayType.Weekday, DayType.Weekend, DayType.Holiday], {
    errorMap: () => ({ message: "Day type is invalid" }),
  }),
  effectiveDate: z.string().min(1, { message: "Effective date is required" }),
  timeRange: z.object({
    start: z.string().min(1, { message: "Start time is required" }),
    end: z.string().min(1, { message: "End time is required" }),
  }),
  price: z.string().min(1, { message: "Price is required" }),
  endDate: z.string().optional(),
  note: z.string().optional(),
});
