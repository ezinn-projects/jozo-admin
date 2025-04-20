/**
 * Format a number as Vietnamese currency
 * @param amount The amount to format
 * @returns Formatted amount as string
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN").format(amount);
};

/**
 * Format a date string to a readable format
 * @param dateString ISO date string
 * @param format Format string (default: DD/MM/YYYY)
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string,
  format = "DD/MM/YYYY"
): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  let result = format;
  result = result.replace(/DD/g, day);
  result = result.replace(/MM/g, month);
  result = result.replace(/YYYY/g, year.toString());

  return result;
};
