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

export const addPricingSchema = z
  .object({
    dayType: z.enum([DayType.Weekday, DayType.Weekend, DayType.Holiday], {
      errorMap: () => ({ message: "Loại ngày không hợp lệ" }),
    }),
    timeSlots: z
      .array(
        z
          .object({
            start: z
              .string()
              .min(1, { message: "Vui lòng chọn giờ bắt đầu" })
              .regex(/^([01]?[0-9]|2[0-3]|00):[0-5][0-9]$/, {
                message: "Định dạng giờ không hợp lệ (HH:mm)",
              }),
            end: z
              .string()
              .min(1, { message: "Vui lòng chọn giờ kết thúc" })
              .regex(/^([01]?[0-9]|2[0-3]|00):[0-5][0-9]$/, {
                message: "Định dạng giờ không hợp lệ (HH:mm)",
              }),
            prices: z
              .array(
                z.object({
                  roomType: z.enum(
                    [RoomType.Small, RoomType.Medium, RoomType.Large],
                    {
                      errorMap: () => ({ message: "Loại phòng không hợp lệ" }),
                    }
                  ),
                  price: z.string().min(1, { message: "Vui lòng nhập giá" }),
                })
              )
              .min(1, { message: "Vui lòng nhập giá cho các loại phòng" }),
          })
          .superRefine((data, ctx) => {
            if (!data.start || !data.end) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Vui lòng nhập đầy đủ thời gian bắt đầu và kết thúc",
                path: ["timeRange"],
              });
            }
          })
      )
      .length(2, { message: "Phải có đủ 2 khung giờ" })
      .refine(
        (timeSlots) => {
          // Sắp xếp các time slots theo thời gian bắt đầu
          const sortedSlots = [...timeSlots].sort((a, b) => {
            if (a.start < b.start) return -1;
            if (a.start > b.start) return 1;
            return 0;
          });

          // Kiểm tra từng cặp time slots liền kề
          for (let i = 0; i < sortedSlots.length - 1; i++) {
            const currentSlot = sortedSlots[i];
            const nextSlot = sortedSlots[i + 1];

            // Thời gian kết thúc của slot hiện tại phải <= thời gian bắt đầu của slot tiếp theo
            if (currentSlot.end > nextSlot.start) {
              return false;
            }
          }
          return true;
        },
        { message: "Các khung giờ không được trùng nhau" }
      )
      .refine(
        (timeRanges) => {
          return timeRanges.every((range) => {
            if (range.start && range.end) {
              // Trường hợp đặc biệt: nếu end time là 00:00, coi như là cuối ngày
              if (range.end === "00:00") {
                return range.start < "24:00";
              }
              return range.start < range.end;
            }
            return true;
          });
        },
        { message: "Thời gian kết thúc phải sau thời gian bắt đầu" }
      ),
    effectiveDate: z
      .string()
      .min(1, { message: "Vui lòng chọn ngày hiệu lực" }),
    endDate: z.string().optional(),
    note: z.string().optional(),
  })
  .refine(
    (data) => {
      // Kiểm tra nếu có endDate thì phải sau effectiveDate
      if (data.endDate && data.effectiveDate) {
        return new Date(data.endDate) > new Date(data.effectiveDate);
      }
      return true;
    },
    {
      message: "Ngày kết thúc phải sau ngày hiệu lực",
      path: ["endDate"],
    }
  );
