import { z } from "zod";

export const gameTypeFormSchema = z.object({
  name: z.string().min(1, "Tên loại game là bắt buộc"),
  slug: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean(),
});

export type GameTypeFormValues = z.infer<typeof gameTypeFormSchema>;

export const gameFormSchema = z.object({
  typeId: z.string().min(1, "Loại game là bắt buộc"),
  name: z.string().min(1, "Tên game là bắt buộc"),
  slug: z.string().optional(),
  shortDescription: z.string().optional(),
  guideContent: z.string().min(1, "Hướng dẫn chơi là bắt buộc"),
  minPlayers: z.coerce.number().int().min(1, "Số người chơi tối thiểu phải >= 1"),
  maxPlayers: z.coerce.number().int().min(1, "Số người chơi tối đa phải >= 1"),
  playTimeMinutes: z.coerce.number().int().min(1, "Thời lượng chơi phải >= 1 phút"),
  isActive: z.boolean(),
}).superRefine((data, ctx) => {
  if (data.maxPlayers < data.minPlayers) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Số người chơi tối đa phải >= số người chơi tối thiểu",
      path: ["maxPlayers"],
    });
  }
});

export type GameFormValues = z.infer<typeof gameFormSchema>;

export type ActiveFilterValue = "all" | "active" | "inactive";
