import dayjs, { type Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

// Set default timezone to Vietnam
dayjs.tz.setDefault("Asia/Ho_Chi_Minh");

// Set default locale to Vietnamese
dayjs.locale("vi");

/**
 * Parse UTC time from server và convert sang giờ Việt Nam
 * @param date - Date string hoặc Date object từ server (UTC)
 * @returns Dayjs object đã convert sang timezone Việt Nam
 */
export const parseUTCToLocal = (date: string | Date) => {
  return dayjs.utc(date).tz("Asia/Ho_Chi_Minh");
};

/**
 * Format thời gian từ server (UTC) sang định dạng mong muốn ở timezone Việt Nam
 * @param date - Date string hoặc Date object từ server (UTC)
 * @param format - Format string (default: "DD/MM/YYYY HH:mm")
 * @returns Formatted time string
 */
export const formatUTCToLocal = (
  date: string | Date,
  format: string = "DD/MM/YYYY HH:mm"
) => {
  return parseUTCToLocal(date).format(format);
};

/**
 * Hiển thị thời gian tương đối (x giờ trước, x phút trước...)
 * @param date - Date string hoặc Date object từ server (UTC)
 * @returns Relative time string (vd: "2 giờ trước")
 */
export const timeAgo = (date: string | Date) => {
  return parseUTCToLocal(date).fromNow();
};

/**
 * ISO 8601 UTC: luôn có giây và phần thập phân là .000 (không ms ngẫu nhiên),
 * giây lấy từ đồng hồ được ép về :00 để BE so khớp thời gian người chọn.
 */
export const toIsoStringWithZeroSubsecond = (d: Dayjs): string =>
  d.second(0).millisecond(0).toISOString();

export default dayjs;
