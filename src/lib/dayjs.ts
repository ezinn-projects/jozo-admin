import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Set default timezone to Vietnam
dayjs.tz.setDefault("Asia/Ho_Chi_Minh");

export default dayjs;
