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
