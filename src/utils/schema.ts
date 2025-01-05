import { DayType, RoomType } from "@/constants/enum";
// import { RoomSize } from "@/constants/enum";
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
  prices: z.array(
    z.object({
      roomType: z.enum([RoomType.Small, RoomType.Medium, RoomType.Large], {
        errorMap: () => ({ message: "Room size is invalid" }),
      }),
      price: z.string().min(1, { message: "Price is required" }),
    })
  ),
  dayType: z.enum([DayType.Weekday, DayType.Weekend, DayType.Holiday], {
    errorMap: () => ({ message: "Day type is invalid" }),
  }),
  timeRange: z.object({
    start: z.string().min(1, { message: "Start time is required" }),
    end: z.string().min(1, { message: "End time is required" }),
  }),
  effectiveDate: z.string().min(1, { message: "Effective date is required" }),
  endDate: z.string().optional(),
  note: z.string().optional(),
});
