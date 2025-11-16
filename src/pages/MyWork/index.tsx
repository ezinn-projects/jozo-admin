import { IEmployeeSchedule } from "@/apis/staffSchedule.apis";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeScheduleStatus, ShiftType } from "@/constants/enum";
import { useMySchedules, ViewMode } from "@/hooks/use-my-schedules";
import { cn } from "@/lib/utils";
import StaffScheduleDetailModal from "@/pages/StaffSchedule/components/StaffScheduleDetailModal";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import dayjs, { Dayjs } from "dayjs";
import {
  AlertCircle,
  Briefcase,
  CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Loader2,
  PlayCircle,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

const MySchedulePage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [selectedStatus, setSelectedStatus] = useState<
    EmployeeScheduleStatus | undefined
  >(undefined);
  const [selectedShiftType, setSelectedShiftType] = useState<
    ShiftType | undefined
  >(undefined);
  const [selectedSchedule, setSelectedSchedule] =
    useState<IEmployeeSchedule | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Calculate date range based on view mode
  const { startDate, endDate, dates } = useMemo(() => {
    let start: Dayjs;
    let end: Dayjs;
    const dateList: Dayjs[] = [];

    if (viewMode === "day") {
      start = currentDate.startOf("day");
      end = currentDate.endOf("day");
      dateList.push(currentDate);
    } else if (viewMode === "week") {
      const dayOfWeek = currentDate.day();
      if (dayOfWeek === 0) {
        start = currentDate.subtract(6, "day");
      } else {
        const daysToSubtract = dayOfWeek - 1;
        start = currentDate.subtract(daysToSubtract, "day");
      }
      end = start.add(6, "day");
      for (let i = 0; i < 7; i++) {
        dateList.push(start.add(i, "day"));
      }
    } else {
      start = currentDate.startOf("month");
      end = currentDate.endOf("month");
      const daysInMonth = currentDate.daysInMonth();
      for (let i = 0; i < daysInMonth; i++) {
        dateList.push(start.add(i, "day"));
      }
    }

    return { startDate: start, endDate: end, dates: dateList };
  }, [viewMode, currentDate]);

  // Build options for API call
  const options = useMemo(() => {
    const opts: {
      filterType: ViewMode;
      date?: Dayjs;
      startDate?: Dayjs;
      endDate?: Dayjs;
      status?: EmployeeScheduleStatus;
      shiftType?: ShiftType;
    } = {
      filterType: viewMode,
    };

    if (viewMode === "day") {
      opts.date = currentDate;
    } else if (viewMode === "week") {
      opts.startDate = startDate;
      opts.endDate = endDate;
    } else {
      // month view
      opts.date = currentDate;
    }

    if (selectedStatus !== "all") {
      opts.status = selectedStatus;
    }

    if (selectedShiftType !== ShiftType.All) {
      opts.shiftType = selectedShiftType;
    }

    return opts;
  }, [
    viewMode,
    currentDate,
    startDate,
    endDate,
    selectedStatus,
    selectedShiftType,
  ]);

  const {
    data: { schedules = [], summary } = { schedules: [], summary: null },
    isLoading,
    refetch,
  } = useMySchedules(options);

  // Get all schedules for current month (for salary calculation, no filters)
  const { data: { schedules: monthSchedules = [] } = { schedules: [] } } =
    useMySchedules({
      filterType: "month",
      date: currentDate,
    });

  // Group schedules by date
  const schedulesByDate = useMemo(() => {
    const map = new Map<string, IEmployeeSchedule[]>();
    schedules.forEach((schedule) => {
      const dateKey = schedule.date;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(schedule);
    });
    return map;
  }, [schedules]);

  const handlePrevious = () => {
    if (viewMode === "day") {
      setCurrentDate(currentDate.subtract(1, "day"));
    } else if (viewMode === "week") {
      setCurrentDate(currentDate.subtract(1, "week"));
    } else {
      setCurrentDate(currentDate.subtract(1, "month"));
    }
  };

  const handleNext = () => {
    if (viewMode === "day") {
      setCurrentDate(currentDate.add(1, "day"));
    } else if (viewMode === "week") {
      setCurrentDate(currentDate.add(1, "week"));
    } else {
      setCurrentDate(currentDate.add(1, "month"));
    }
  };

  const handleScheduleClick = (schedule: IEmployeeSchedule) => {
    setSelectedSchedule(schedule);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedSchedule(null);
    refetch();
  };

  const getStatusColor = (status: EmployeeScheduleStatus) => {
    switch (status) {
      case EmployeeScheduleStatus.Approved:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case EmployeeScheduleStatus.InProgress:
        return "bg-purple-100 text-purple-800 border-purple-200";
      case EmployeeScheduleStatus.Completed:
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case EmployeeScheduleStatus.Pending:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case EmployeeScheduleStatus.Rejected:
      case EmployeeScheduleStatus.Cancelled:
        return "bg-red-100 text-red-800 border-red-200";
      case EmployeeScheduleStatus.Absent:
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: EmployeeScheduleStatus) => {
    switch (status) {
      case EmployeeScheduleStatus.Completed:
        return <CheckCircle2 className="h-4 w-4" />;
      case EmployeeScheduleStatus.InProgress:
        return <PlayCircle className="h-4 w-4" />;
      case EmployeeScheduleStatus.Pending:
        return <AlertCircle className="h-4 w-4" />;
      case EmployeeScheduleStatus.Rejected:
      case EmployeeScheduleStatus.Cancelled:
      case EmployeeScheduleStatus.Absent:
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getShiftLabel = (schedule: IEmployeeSchedule) => {
    const shift = schedule.shift || schedule.shiftType;
    if (schedule.customStartTime && schedule.customEndTime) {
      return `${schedule.customStartTime} - ${schedule.customEndTime}`;
    }
    if (shift === "morning") return "Morning (12:00 - 17:00)";
    if (shift === "afternoon") return "Afternoon (17:00 - 22:00)";
    return shift || "Custom";
  };

  const getShiftBadgeColor = (schedule: IEmployeeSchedule) => {
    const shift = schedule.shift || schedule.shiftType;
    if (shift === "morning") return "bg-orange-100 text-orange-800";
    if (shift === "afternoon") return "bg-indigo-100 text-indigo-800";
    return "bg-gray-100 text-gray-800";
  };

  // Calculate salary information based on current month (not filtered)
  const salaryInfo = useMemo(() => {
    const hourlyRate = 22000; // 22k VND per hour
    const completedSchedules = monthSchedules.filter(
      (s) => s.status === EmployeeScheduleStatus.Completed
    );

    // Calculate total hours for completed shifts
    let totalHours = 0;
    completedSchedules.forEach((schedule) => {
      if (schedule.customStartTime && schedule.customEndTime) {
        // Calculate hours from custom times
        const [startHour, startMin] = schedule.customStartTime
          .split(":")
          .map(Number);
        const [endHour, endMin] = schedule.customEndTime.split(":").map(Number);
        const startTotal = startHour * 60 + startMin;
        const endTotal = endHour * 60 + endMin;
        const diffMinutes = endTotal - startTotal;
        totalHours += diffMinutes / 60;
      } else {
        // Default shift hours (5 hours per shift)
        const shift = schedule.shift || schedule.shiftType;
        if (shift === "morning" || shift === "afternoon") {
          totalHours += 5; // 5 hours per shift
        } else {
          // Default to 5 hours if unknown
          totalHours += 5;
        }
      }
    });

    const totalSalary = totalHours * hourlyRate;
    const totalRegistered = monthSchedules.length;
    const totalCompleted = completedSchedules.length;
    const completionRate =
      totalRegistered > 0 ? (totalCompleted / totalRegistered) * 100 : 0;

    return {
      totalRegistered,
      totalCompleted,
      totalHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal
      totalSalary,
      completionRate: Math.round(completionRate * 10) / 10,
    };
  }, [monthSchedules]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="md:text-3xl text-xl font-bold flex items-center gap-2">
            <Briefcase className="h-8 w-8" />
            My Work Schedule
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage your work schedule
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Shifts
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalShifts}</div>
              <p className="text-xs text-muted-foreground">
                {summary.totalDays} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {summary.upcoming}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.byStatus.approved} approved shifts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <PlayCircle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {summary.inProgress}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.byStatus["in-progress"]} active shifts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {summary.completed}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.byStatus.completed} completed shifts
              </p>
            </CardContent>
          </Card>

          {/* Salary Card */}
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium">Earnings</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentDate.format("MM/YYYY")}
                </p>
              </div>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {salaryInfo.totalSalary.toLocaleString("vi-VN")}₫
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {salaryInfo.totalCompleted} completed shifts
              </p>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {salaryInfo.totalCompleted}/{salaryInfo.totalRegistered}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${salaryInfo.completionRate}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & View</CardTitle>
          <CardDescription>
            Select time range and filters to view your work schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4 flex-wrap">
              <Tabs
                value={viewMode}
                onValueChange={(value) => setViewMode(value as ViewMode)}
              >
                <TabsList>
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevious}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[200px] justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {viewMode === "day"
                        ? currentDate.format("DD/MM/YYYY")
                        : viewMode === "week"
                        ? `${startDate.format("DD/MM")} - ${endDate.format(
                            "DD/MM/YYYY"
                          )}`
                        : currentDate.format("MM/YYYY")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={currentDate.toDate()}
                      onSelect={(date) => date && setCurrentDate(dayjs(date))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button variant="outline" size="icon" onClick={handleNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={selectedStatus}
                onValueChange={(value) =>
                  setSelectedStatus(value as EmployeeScheduleStatus | undefined)
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={EmployeeScheduleStatus.Pending}>
                    Pending
                  </SelectItem>
                  <SelectItem value={EmployeeScheduleStatus.Approved}>
                    Approved
                  </SelectItem>
                  <SelectItem value={EmployeeScheduleStatus.InProgress}>
                    In Progress
                  </SelectItem>
                  <SelectItem value={EmployeeScheduleStatus.Completed}>
                    Completed
                  </SelectItem>
                  <SelectItem value={EmployeeScheduleStatus.Absent}>
                    Absent
                  </SelectItem>
                  <SelectItem value={EmployeeScheduleStatus.Rejected}>
                    Rejected
                  </SelectItem>
                  <SelectItem value={EmployeeScheduleStatus.Cancelled}>
                    Cancelled
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={selectedShiftType}
                onValueChange={(value) =>
                  setSelectedShiftType(value as ShiftType)
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Shift Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shifts</SelectItem>
                  <SelectItem value="morning">Morning Shift</SelectItem>
                  <SelectItem value="afternoon">Afternoon Shift</SelectItem>
                  <SelectItem value="custom">Custom Shift</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle>Work Schedule</CardTitle>
          <CardDescription>
            {viewMode === "day"
              ? `Work schedule for ${currentDate.format("DD/MM/YYYY")}`
              : viewMode === "week"
              ? `Work schedule from ${startDate.format(
                  "DD/MM"
                )} to ${endDate.format("DD/MM/YYYY")}`
              : `Work schedule for ${currentDate.format("MM/YYYY")}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : schedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                No work shifts found
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Try selecting a different time range or change the filters
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {dates.map((date) => {
                const dateKey = date.format("YYYY-MM-DD");
                const daySchedules = schedulesByDate.get(dateKey) || [];
                const isToday = date.isSame(dayjs(), "day");
                const isPast = date.isBefore(dayjs(), "day");

                if (daySchedules.length === 0 && viewMode === "month") {
                  return null;
                }

                return (
                  <div
                    key={dateKey}
                    className={cn(
                      "border rounded-lg p-4 transition-colors",
                      isToday && "border-blue-500 bg-blue-50/50",
                      isPast && !isToday && "opacity-60"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3
                          className={cn(
                            "text-lg font-semibold",
                            isToday && "text-blue-600"
                          )}
                        >
                          {format(date.toDate(), "EEEE, dd/MM/yyyy", {
                            locale: vi,
                          })}
                        </h3>
                        {isToday && (
                          <Badge
                            variant="default"
                            className="bg-blue-600 whitespace-nowrap"
                          >
                            Today
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline" className="whitespace-nowrap">
                        {daySchedules.length} shift
                        {daySchedules.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>

                    {daySchedules.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        No work shifts
                      </p>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {daySchedules.map((schedule) => (
                          <div
                            key={schedule._id}
                            onClick={() => handleScheduleClick(schedule)}
                            className={cn(
                              "border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md hover:border-primary",
                              getStatusColor(schedule.status)
                            )}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(schedule.status)}
                                <Badge
                                  variant="outline"
                                  className={getShiftBadgeColor(schedule)}
                                >
                                  {getShiftLabel(schedule)}
                                </Badge>
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "border",
                                  getStatusColor(schedule.status)
                                )}
                              >
                                {schedule.status ===
                                EmployeeScheduleStatus.Pending
                                  ? "Pending"
                                  : schedule.status ===
                                    EmployeeScheduleStatus.Approved
                                  ? "Approved"
                                  : schedule.status ===
                                    EmployeeScheduleStatus.InProgress
                                  ? "In Progress"
                                  : schedule.status ===
                                    EmployeeScheduleStatus.Completed
                                  ? "Completed"
                                  : schedule.status ===
                                    EmployeeScheduleStatus.Absent
                                  ? "Absent"
                                  : schedule.status ===
                                    EmployeeScheduleStatus.Rejected
                                  ? "Rejected"
                                  : schedule.status ===
                                    EmployeeScheduleStatus.Cancelled
                                  ? "Cancelled"
                                  : schedule.status}
                              </Badge>
                            </div>
                            {schedule.note && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {schedule.note}
                              </p>
                            )}
                            {schedule.shiftInfo && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                <div>
                                  {schedule.shiftInfo.name}:{" "}
                                  {schedule.shiftInfo.startTime} -{" "}
                                  {schedule.shiftInfo.endTime}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <StaffScheduleDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        schedule={selectedSchedule}
        refetchSchedules={refetch}
      />
    </div>
  );
};

export default MySchedulePage;
