import { useQuery } from "@tanstack/react-query";
import dayjs, { Dayjs } from "dayjs";
import staffScheduleApis, {
  IEmployeeSchedule,
  IEmployeeSchedulesResponse,
  IEmployeeSchedulesSummary,
} from "@/apis/staffSchedule.apis";
import { EmployeeScheduleStatus, ShiftType } from "@/constants/enum";

export type ViewMode = "day" | "week" | "month";

export interface UseMySchedulesOptions {
  status?: EmployeeScheduleStatus;
  shiftType?: ShiftType;
  filterType?: ViewMode;
  date?: Dayjs;
  startDate?: Dayjs;
  endDate?: Dayjs;
}

export const useMySchedules = (options?: UseMySchedulesOptions) => {
  return useQuery<
    { schedules: IEmployeeSchedule[]; summary: IEmployeeSchedulesSummary },
    Error
  >({
    queryKey: [
      "mySchedules",
      options?.status,
      options?.shiftType,
      options?.filterType,
      options?.date?.format("YYYY-MM-DD"),
      options?.startDate?.format("YYYY-MM-DD"),
      options?.endDate?.format("YYYY-MM-DD"),
    ],
    queryFn: async () => {
      // Xây dựng params dựa trên options
      const params: {
        status?: EmployeeScheduleStatus;
        shiftType?: ShiftType;
        filterType?: ViewMode;
        date?: string;
        startDate?: string;
        endDate?: string;
      } = {};

      if (options?.filterType === "day" && options?.date) {
        params.filterType = "day";
        params.date = options.date.format("YYYY-MM-DD");
      } else if (options?.filterType === "week") {
        params.filterType = "week";
        if (options?.startDate) {
          params.startDate = options.startDate.format("YYYY-MM-DD");
        }
        if (options?.endDate) {
          params.endDate = options.endDate.format("YYYY-MM-DD");
        }
      } else if (options?.filterType === "month" && options?.date) {
        params.filterType = "month";
        params.startDate = options.date.startOf("month").format("YYYY-MM-DD");
        params.endDate = options.date.endOf("month").format("YYYY-MM-DD");
      } else if (options?.startDate && options?.endDate) {
        params.startDate = options.startDate.format("YYYY-MM-DD");
        params.endDate = options.endDate.format("YYYY-MM-DD");
      }

      if (options?.status) {
        params.status = options.status;
      }

      if (options?.shiftType) {
        params.shiftType = options.shiftType;
      }

      const response = await staffScheduleApis.getMySchedules(params);
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
                const dateObj = dayjs(schedule.date);
                if (dateObj.isValid()) {
                  normalizedDate = dateObj.format("YYYY-MM-DD");
                }
              } catch {
                normalizedDate = dateKey;
              }
            }

            // Normalize shift - convert to ShiftType enum
            let normalizedShiftType: ShiftType | undefined = undefined;

            // First, try to get from shift field
            const shiftValue = schedule.shift;
            if (shiftValue) {
              if (shiftValue === "shift2" || shiftValue === "afternoon" || shiftValue === "evening") {
                normalizedShiftType = ShiftType.Afternoon;
              } else if (shiftValue === "shift1" || shiftValue === "morning") {
                normalizedShiftType = ShiftType.Morning;
              } else if (shiftValue === "shift3" || shiftValue === "all") {
                normalizedShiftType = ShiftType.All;
              }
            }

            // If no shift, try to get from shiftType field
            if (!normalizedShiftType && schedule.shiftType) {
              const shiftTypeValue = schedule.shiftType;
              if (
                shiftTypeValue === "shift2" ||
                shiftTypeValue === "evening" ||
                shiftTypeValue === "afternoon"
              ) {
                normalizedShiftType = ShiftType.Afternoon;
              } else if (shiftTypeValue === "shift1" || shiftTypeValue === "morning") {
                normalizedShiftType = ShiftType.Morning;
              } else if (shiftTypeValue === "shift3" || shiftTypeValue === "all") {
                normalizedShiftType = ShiftType.All;
              }
            }

            let normalizedShift:
              | "shift1"
              | "shift2"
              | "shift3"
              | undefined = undefined;
            if (normalizedShiftType === ShiftType.Morning) {
              normalizedShift = "shift1";
            } else if (normalizedShiftType === ShiftType.Afternoon) {
              normalizedShift = "shift2";
            } else if (normalizedShiftType === ShiftType.All) {
              normalizedShift = "shift3";
            }

            const normalizedSchedule: IEmployeeSchedule = {
              ...schedule,
              date: normalizedDate,
              shift: normalizedShift,
              shiftType:
                normalizedShiftType === ShiftType.Morning
                  ? "shift1"
                  : normalizedShiftType === ShiftType.Afternoon
                  ? "shift2"
                  : normalizedShiftType === ShiftType.All
                  ? "shift3"
                  : schedule.shiftType,
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
