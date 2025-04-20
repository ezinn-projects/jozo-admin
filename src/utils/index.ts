import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * @param inputs The class names to merge
 * @returns Merged class name
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert a size (as pixels) to a rem value
 * @param size Size in pixels
 * @returns Size as a rem value
 */
export function pxToRem(size: number): string {
  return `${size / 16}rem`;
}

export const formatCurrency = (value: number, showCurrencySymbol = true) => {
  const formatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  if (showCurrencySymbol) {
    return formatter.format(value);
  }

  return value?.toLocaleString("vi-VN") || "";
};
