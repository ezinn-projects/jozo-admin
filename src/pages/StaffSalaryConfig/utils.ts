export const formatVndInput = (value?: number | string) => {
  const numericValue = Number(value || 0);

  if (!Number.isFinite(numericValue)) {
    return "";
  }

  return numericValue.toLocaleString("vi-VN");
};

export const parseVndInput = (value: string) => {
  const digitsOnly = value.replace(/[^\d]/g, "");
  return digitsOnly ? Number(digitsOnly) : 0;
};
