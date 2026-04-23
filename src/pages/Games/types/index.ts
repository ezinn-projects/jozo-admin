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
  isActive: z.boolean(),
});

export type GameFormValues = z.infer<typeof gameFormSchema>;

export type ActiveFilterValue = "all" | "active" | "inactive";
