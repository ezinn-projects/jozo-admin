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
    if (shift === "morning") return "Ca Sáng (12:00 - 17:00)";
    if (shift === "afternoon") return "Ca Chiều (17:00 - 22:00)";
    return shift || "Custom";
  };

  const getShiftBadgeColor = (schedule: IEmployeeSchedule) => {
    const shift = schedule.shift || schedule.shiftType;
    if (shift === "morning") return "bg-orange-100 text-orange-800";
    if (shift === "afternoon") return "bg-indigo-100 text-indigo-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="md:text-3xl text-xl font-bold flex items-center gap-2">
            <Briefcase className="h-8 w-8" />
            Lịch Làm Việc Của Tôi
          </h1>
          <p className="text-muted-foreground mt-1">
            Xem và quản lý lịch làm việc của bạn
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng Ca Làm</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalShifts}</div>
              <p className="text-xs text-muted-foreground">
                {summary.totalDays} ngày
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Đã Hoàn Thành
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {summary.completed}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.byStatus.completed} ca hoàn thành
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đang Làm</CardTitle>
              <PlayCircle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {summary.inProgress}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.byStatus["in-progress"]} ca đang làm
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sắp Tới</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {summary.upcoming}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.byStatus.approved} ca đã duyệt
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ Lọc & Xem</CardTitle>
          <CardDescription>
            Chọn khoảng thời gian và bộ lọc để xem lịch làm việc
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
                  <TabsTrigger value="day">Ngày</TabsTrigger>
                  <TabsTrigger value="week">Tuần</TabsTrigger>
                  <TabsTrigger value="month">Tháng</TabsTrigger>
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
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value={EmployeeScheduleStatus.Pending}>
                    Chờ duyệt
                  </SelectItem>
                  <SelectItem value={EmployeeScheduleStatus.Approved}>
                    Đã duyệt
                  </SelectItem>
                  <SelectItem value={EmployeeScheduleStatus.InProgress}>
                    Đang làm
                  </SelectItem>
                  <SelectItem value={EmployeeScheduleStatus.Completed}>
                    Hoàn thành
                  </SelectItem>
                  <SelectItem value={EmployeeScheduleStatus.Absent}>
                    Vắng mặt
                  </SelectItem>
                  <SelectItem value={EmployeeScheduleStatus.Rejected}>
                    Từ chối
                  </SelectItem>
                  <SelectItem value={EmployeeScheduleStatus.Cancelled}>
                    Hủy
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
                  <SelectValue placeholder="Loại ca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả ca</SelectItem>
                  <SelectItem value="morning">Ca Sáng</SelectItem>
                  <SelectItem value="afternoon">Ca Chiều</SelectItem>
                  <SelectItem value="custom">Ca Tùy Chỉnh</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch Làm Việc</CardTitle>
          <CardDescription>
            {viewMode === "day"
              ? `Lịch làm việc ngày ${currentDate.format("DD/MM/YYYY")}`
              : viewMode === "week"
              ? `Lịch làm việc tuần từ ${startDate.format(
                  "DD/MM"
                )} đến ${endDate.format("DD/MM/YYYY")}`
              : `Lịch làm việc tháng ${currentDate.format("MM/YYYY")}`}
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
                Không có ca làm việc nào
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Hãy thử chọn khoảng thời gian khác hoặc thay đổi bộ lọc
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
                            Hôm Nay
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline" className="whitespace-nowrap">
                        {daySchedules.length} ca
                      </Badge>
                    </div>

                    {daySchedules.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        Không có ca làm việc
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
                                  ? "Chờ duyệt"
                                  : schedule.status ===
                                    EmployeeScheduleStatus.Approved
                                  ? "Đã duyệt"
                                  : schedule.status ===
                                    EmployeeScheduleStatus.InProgress
                                  ? "Đang làm"
                                  : schedule.status ===
                                    EmployeeScheduleStatus.Completed
                                  ? "Hoàn thành"
                                  : schedule.status ===
                                    EmployeeScheduleStatus.Absent
                                  ? "Vắng mặt"
                                  : schedule.status ===
                                    EmployeeScheduleStatus.Rejected
                                  ? "Từ chối"
                                  : schedule.status ===
                                    EmployeeScheduleStatus.Cancelled
                                  ? "Hủy"
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
