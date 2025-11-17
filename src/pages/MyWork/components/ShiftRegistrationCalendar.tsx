import dayjs, { Dayjs } from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { IEmployeeSchedule } from "@/apis/staffSchedule.apis";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ShiftRegistrationCalendarProps {
  schedules: IEmployeeSchedule[];
  onDateClick: (date: Dayjs) => void;
  currentDate: Dayjs;
  onCurrentDateChange: (date: Dayjs) => void;
}

export function ShiftRegistrationCalendar({
  schedules,
  onDateClick,
  currentDate,
  onCurrentDateChange,
}: ShiftRegistrationCalendarProps) {
  // Group schedules by date
  const schedulesByDate = useMemo(() => {
    const map = new Map<string, IEmployeeSchedule[]>();
    schedules.forEach((schedule) => {
      const dateKey = dayjs(schedule.date).format("YYYY-MM-DD");
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(schedule);
    });
    return map;
  }, [schedules]);

  // Generate calendar grid
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = currentDate.startOf("month");
    const lastDayOfMonth = currentDate.endOf("month");
    const firstDayOfWeek = firstDayOfMonth.day();
    const daysInMonth = lastDayOfMonth.date();
    const daysInPrevMonth = firstDayOfMonth.subtract(1, "month").daysInMonth();

    const grid = [];
    let dayCount = 1;
    let nextMonthDayCount = 1;

    // Generate 6 weeks of calendar
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        if (week === 0 && day < firstDayOfWeek) {
          // Days from previous month
          weekDays.push({
            date: currentDate
              .subtract(1, "month")
              .date(daysInPrevMonth - firstDayOfWeek + day + 1),
            isCurrentMonth: false,
          });
        } else if (dayCount > daysInMonth) {
          // Days from next month
          weekDays.push({
            date: currentDate.add(1, "month").date(nextMonthDayCount),
            isCurrentMonth: false,
          });
          nextMonthDayCount++;
        } else {
          // Days from current month
          weekDays.push({
            date: currentDate.date(dayCount),
            isCurrentMonth: true,
          });
          dayCount++;
        }
      }
      grid.push(weekDays);
    }
    return grid;
  }, [currentDate]);

  const handlePrevMonth = () => {
    onCurrentDateChange(currentDate.subtract(1, "month"));
  };

  const handleNextMonth = () => {
    onCurrentDateChange(currentDate.add(1, "month"));
  };

  const handleToday = () => {
    onCurrentDateChange(dayjs());
  };

  const getSchedulesForDate = (date: Dayjs): IEmployeeSchedule[] => {
    const dateKey = date.format("YYYY-MM-DD");
    return schedulesByDate.get(dateKey) || [];
  };

  const getShiftTypesForDate = (date: Dayjs): string[] => {
    const daySchedules = getSchedulesForDate(date);
    const shiftTypes = new Set<string>();
    
    daySchedules.forEach((schedule) => {
      const shift = schedule.shift || schedule.shiftType;
      if (shift === "morning") {
        shiftTypes.add("Ca Sáng");
      } else if (shift === "afternoon" || shift === "evening") {
        shiftTypes.add("Ca Chiều");
      } else if (shift === "all") {
        shiftTypes.add("Cả ngày");
      } else if (schedule.customStartTime && schedule.customEndTime) {
        shiftTypes.add("Ca Tùy chỉnh");
      }
    });
    
    return Array.from(shiftTypes);
  };


  return (
    <div className="w-full">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-3 sm:gap-0">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handlePrevMonth}
            className="h-8 w-8 sm:h-10 sm:w-10"
          >
            <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleNextMonth}
            className="h-8 w-8 sm:h-10 sm:w-10"
          >
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button 
            variant="outline" 
            onClick={handleToday}
            className="h-8 px-2 sm:h-10 sm:px-4 text-xs sm:text-sm"
          >
            Hôm nay
          </Button>
          <h2 className="text-base sm:text-lg md:text-xl font-semibold whitespace-nowrap">
            {currentDate.format("MMMM YYYY")}
          </h2>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {/* Weekday Headers */}
        {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
          <div 
            key={day} 
            className="bg-white p-1 sm:p-2 text-center font-medium text-xs sm:text-sm"
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarGrid.map((week, weekIndex) =>
          week.map((day, dayIndex) => {
            const daySchedules = getSchedulesForDate(day.date);
            const shiftTypes = getShiftTypesForDate(day.date);
            const isToday = day.date.isSame(dayjs(), "day");
            const isPast = day.date.isBefore(dayjs(), "day");
            const isFull = daySchedules.length >= 2;
            const isDisabled = isPast;

            return (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={cn(
                  "min-h-[60px] sm:min-h-[80px] md:min-h-[100px] lg:min-h-[120px] bg-white p-1 sm:p-1.5 md:p-2 relative cursor-pointer transition-colors",
                  !day.isCurrentMonth && "text-gray-400",
                  isToday && "bg-blue-50",
                  isDisabled && "opacity-50 cursor-not-allowed",
                  isFull && !isPast && "bg-gray-50",
                  !isDisabled && "hover:bg-gray-50"
                )}
                onClick={() => {
                  if (!isDisabled) {
                    onDateClick(day.date);
                  }
                }}
              >
                <div
                  className={cn(
                    "font-medium mb-0.5 sm:mb-1 text-xs sm:text-sm",
                    isToday && "text-blue-600 font-bold"
                  )}
                >
                  {day.date.date()}
                </div>
                {shiftTypes.length > 0 && (
                  <div className="mt-0.5 sm:mt-1 space-y-0.5 sm:space-y-1">
                    {/* Mobile: show up to 2 small dots instead of text */}
                    <div className="flex items-center gap-1 sm:hidden">
                      {shiftTypes.slice(0, 2).map((shiftType, idx) => (
                        <span
                          key={idx}
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            shiftType === "Ca Sáng" && "bg-orange-500",
                            shiftType === "Ca Chiều" && "bg-indigo-500",
                            shiftType === "Cả ngày" && "bg-green-500",
                            shiftType === "Ca Tùy chỉnh" && "bg-gray-400"
                          )}
                        />
                      ))}
                    </div>

                    {/* Tablet/Desktop: show text badges */}
                    <div className="hidden sm:block space-y-0.5">
                      {shiftTypes.slice(0, 2).map((shiftType, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className={cn(
                            "text-[10px] sm:text-xs px-1 sm:px-1.5 py-0 sm:py-0.5 w-full justify-center truncate",
                            shiftType === "Ca Sáng" &&
                              "bg-orange-100 text-orange-800 border-orange-200",
                            shiftType === "Ca Chiều" &&
                              "bg-indigo-100 text-indigo-800 border-indigo-200",
                            shiftType === "Cả ngày" &&
                              "bg-green-100 text-green-800 border-green-200",
                            shiftType === "Ca Tùy chỉnh" &&
                              "bg-gray-100 text-gray-800 border-gray-200"
                          )}
                        >
                          <span className="truncate block w-full">
                            {shiftType}
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {daySchedules.length > 0 && !isPast && (
                  <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 text-[9px] sm:text-xs text-muted-foreground font-medium">
                    {daySchedules.length} ca
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

