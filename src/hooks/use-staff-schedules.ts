import { useQuery } from "@tanstack/react-query";
import dayjs, { Dayjs } from "dayjs";
import staffScheduleApis, {
  IEmployeeSchedule,
  IEmployeeSchedulesResponse,
  IEmployeeSchedulesSummary,
} from "@/apis/staffSchedule.apis";

export type ViewMode = "week" | "month";

export interface UseStaffSchedulesOptions {
  userId?: string;
  status?: string;
  filterType?: "day" | "week" | "month";
  date?: Dayjs;
}

export const useStaffSchedules = (
  startDate: Dayjs,
  endDate: Dayjs,
  viewMode: ViewMode = "week",
  options?: UseStaffSchedulesOptions
) => {
  return useQuery<IEmployeeSchedule[], Error>({
    queryKey: [
      "staffSchedules",
      startDate.format("YYYY-MM-DD"),
      endDate.format("YYYY-MM-DD"),
      viewMode,
      options?.userId,
      options?.status,
      options?.filterType,
      options?.date?.format("YYYY-MM-DD"),
    ],
    queryFn: async () => {
      // Xây dựng params dựa trên options
      const params: any = {};

      if (options?.filterType === "day" && options?.date) {
        // Filter theo ngày cụ thể
        params.filterType = "day";
        params.date = options.date.format("YYYY-MM-DD");
      } else if (options?.filterType === "week" && options?.date) {
        // Filter theo tuần
        params.filterType = "week";
        params.startDate = options.date.format("YYYY-MM-DD");
      } else {
        // Mặc định dùng startDate và endDate
        params.startDate = startDate.format("YYYY-MM-DD");
        params.endDate = endDate.format("YYYY-MM-DD");
      }

      if (options?.userId) {
        params.userId = options.userId;
      }

      if (options?.status) {
        params.status = options.status;
      }

      const response = await staffScheduleApis.getEmployeeSchedules(params);
      if (!response.data.result) {
        return [];
      }

      const result = response.data.result as IEmployeeSchedulesResponse;

      // Transform schedulesByDate thành array và normalize dữ liệu
      const schedules: IEmployeeSchedule[] = [];
      Object.entries(result.schedulesByDate || {}).forEach(
        ([dateKey, scheduleList]) => {
          scheduleList.forEach((schedule) => {
            // Normalize date: chuyển ISO string hoặc date string thành YYYY-MM-DD
            let normalizedDate = dateKey;
            if (schedule.date) {
              try {
                // Nếu date là ISO string, extract YYYY-MM-DD
                const dateObj = dayjs(schedule.date);
                if (dateObj.isValid()) {
                  normalizedDate = dateObj.format("YYYY-MM-DD");
                }
              } catch (e) {
                // Nếu không parse được, dùng dateKey từ schedulesByDate
                normalizedDate = dateKey;
              }
            }

            // Normalize: đảm bảo đọc được cả key cũ lẫn key mới
            let normalizedShift = schedule.shift;
            if (
              normalizedShift === "afternoon" ||
              normalizedShift === "evening"
            ) {
              normalizedShift = "shift2";
            } else if (normalizedShift === "morning") {
              normalizedShift = "shift1";
            } else if (normalizedShift === "all") {
              normalizedShift = "shift3";
            } else if (!normalizedShift && schedule.shiftType) {
              // Nếu chưa có shift, dùng shiftType
              normalizedShift =
                schedule.shiftType === "shift2" ||
                schedule.shiftType === "afternoon" ||
                schedule.shiftType === "evening"
                  ? "shift2"
                  : schedule.shiftType === "shift1" ||
                    schedule.shiftType === "morning"
                  ? "shift1"
                  : schedule.shiftType === "shift3" ||
                    schedule.shiftType === "all"
                  ? "shift3"
                  : undefined;
            }

            const normalizedSchedule: IEmployeeSchedule = {
              ...schedule,
              // Normalize date thành YYYY-MM-DD format
              date: normalizedDate,
              shift: normalizedShift,
            };
            schedules.push(normalizedSchedule);
          });
        }
      );

      return schedules;
    },
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

/**
 * Hook để lấy cả response đầy đủ bao gồm schedules và summary
 * Sử dụng khi cần hiển thị summary hoặc cần dữ liệu theo cấu trúc schedulesByDate
 */
export const useStaffSchedulesWithSummary = (
  startDate?: Dayjs,
  endDate?: Dayjs,
  options?: UseStaffSchedulesOptions
) => {
  return useQuery<
    { schedules: IEmployeeSchedule[]; summary: IEmployeeSchedulesSummary },
    Error
  >({
    queryKey: [
      "staffSchedulesWithSummary",
      startDate?.format("YYYY-MM-DD"),
      endDate?.format("YYYY-MM-DD"),
      options?.userId,
      options?.status,
      options?.filterType,
      options?.date?.format("YYYY-MM-DD"),
    ],
    queryFn: async () => {
      // Xây dựng params dựa trên options
      const params: any = {};

      if (options?.filterType === "day" && options?.date) {
        // Filter theo ngày cụ thể
        params.filterType = "day";
        params.date = options.date.format("YYYY-MM-DD");
      } else if (options?.filterType === "week" && options?.date) {
        // Filter theo tuần
        params.filterType = "week";
        params.startDate = options.date.format("YYYY-MM-DD");
      } else if (startDate && endDate) {
        // Mặc định dùng startDate và endDate
        params.startDate = startDate.format("YYYY-MM-DD");
        params.endDate = endDate.format("YYYY-MM-DD");
      }

      if (options?.userId) {
        params.userId = options.userId;
      }

      if (options?.status) {
        params.status = options.status;
      }

      const response = await staffScheduleApis.getEmployeeSchedules(params);
      if (!response.data.result) {
        return {
          schedules: [],
          summary: {
            totalDays: 0,
            totalShifts: 0,
            completed: 0,
            inProgress: 0,
            upcoming: 0,
            byStatus: {
              pending: 0,
              approved: 0,
              "in-progress": 0,
              completed: 0,
              absent: 0,
              rejected: 0,
              cancelled: 0,
            },
          },
        };
      }

      const result = response.data.result as IEmployeeSchedulesResponse;

      // Transform schedulesByDate thành array và normalize dữ liệu
      const schedules: IEmployeeSchedule[] = [];
      Object.entries(result.schedulesByDate || {}).forEach(
        ([dateKey, scheduleList]) => {
          scheduleList.forEach((schedule) => {
            // Normalize date: chuyển ISO string hoặc date string thành YYYY-MM-DD
            let normalizedDate = dateKey;
            if (schedule.date) {
              try {
                // Nếu date là ISO string, extract YYYY-MM-DD
                const dateObj = dayjs(schedule.date);
                if (dateObj.isValid()) {
                  normalizedDate = dateObj.format("YYYY-MM-DD");
                }
              } catch (e) {
                // Nếu không parse được, dùng dateKey từ schedulesByDate
                normalizedDate = dateKey;
              }
            }

            // Normalize: đảm bảo đọc được cả key cũ lẫn key mới
            let normalizedShift = schedule.shift;
            if (
              normalizedShift === "afternoon" ||
              normalizedShift === "evening"
            ) {
              normalizedShift = "shift2";
            } else if (normalizedShift === "morning") {
              normalizedShift = "shift1";
            } else if (normalizedShift === "all") {
              normalizedShift = "shift3";
            } else if (!normalizedShift && schedule.shiftType) {
              // Nếu chưa có shift, dùng shiftType
              normalizedShift =
                schedule.shiftType === "shift2" ||
                schedule.shiftType === "afternoon" ||
                schedule.shiftType === "evening"
                  ? "shift2"
                  : schedule.shiftType === "shift1" ||
                    schedule.shiftType === "morning"
                  ? "shift1"
                  : schedule.shiftType === "shift3" ||
                    schedule.shiftType === "all"
                  ? "shift3"
                  : undefined;
            }

            const normalizedSchedule: IEmployeeSchedule = {
              ...schedule,
              // Normalize date thành YYYY-MM-DD format
              date: normalizedDate,
              shift: normalizedShift,
            };
            schedules.push(normalizedSchedule);
          });
        }
      );

      return {
        schedules,
        summary: result.summary || {
          totalDays: 0,
          totalShifts: 0,
          completed: 0,
          inProgress: 0,
          upcoming: 0,
          byStatus: {
            pending: 0,
            approved: 0,
            "in-progress": 0,
            completed: 0,
            absent: 0,
            rejected: 0,
            cancelled: 0,
          },
        },
      };
    },
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

