import { useState, useMemo, useEffect } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { useUsers } from "@/hooks/use-users";
import { User } from "@/@types/user";
import { Role, EmployeeScheduleStatus, ShiftType } from "@/constants/enum";
import StaffScheduleRegistrationModal from "@/pages/RoomSchedule/components/StaffScheduleRegistrationModal";
import StaffScheduleDetailModal from "./components/StaffScheduleDetailModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import dayjs, { Dayjs } from "dayjs";
import { useStaffSchedules, ViewMode } from "@/hooks/use-staff-schedules";
import { IEmployeeSchedule } from "@/apis/staffSchedule.apis";
import { cn } from "@/lib/utils";
import { useSocket } from "@/hooks/useSocket";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import PATHS from "@/constants/paths";

const StaffSchedulePage = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedStaffName, setSelectedStaffName] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] =
    useState<IEmployeeSchedule | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [initialDate, setInitialDate] = useState<Date | undefined>(undefined);
  const [initialShift, setInitialShift] = useState<ShiftType | undefined>(
    undefined
  );

  const { users, isLoadingUsers } = useUsers();
  
  // Array mapping for day names in Vietnamese
  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const { toast } = useToast();
  const { onNewScheduleRegistration, offNewScheduleRegistration } = useSocket();

  // Calculate startDate and endDate based on viewMode and currentDate
  const { startDate, endDate, dates } = useMemo(() => {
    let start: Dayjs;
    let end: Dayjs;
    const dateList: Dayjs[] = [];

    if (viewMode === "week") {
      // Get Monday of the week (dayjs defaults Sunday as start of week, so Monday = day 1)
      const dayOfWeek = currentDate.day(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      if (dayOfWeek === 0) {
        // If Sunday, go back to Monday of previous week
        start = currentDate.subtract(6, "day");
      } else {
        // Calculate days to subtract to get to Monday (day 1)
        const daysToSubtract = dayOfWeek - 1;
        start = currentDate.subtract(daysToSubtract, "day");
      }
      end = start.add(6, "day");

      // Create list of 7 days
      for (let i = 0; i < 7; i++) {
        dateList.push(start.add(i, "day"));
      }
    } else {
      // Month view
      start = currentDate.startOf("month");
      end = currentDate.endOf("month");

      // Create list of all days in the month
      const daysInMonth = currentDate.daysInMonth();
      for (let i = 0; i < daysInMonth; i++) {
        dateList.push(start.add(i, "day"));
      }
    }

    return { startDate: start, endDate: end, dates: dateList };
  }, [viewMode, currentDate]);

  const {
    data: schedules = [],
    isLoading: isLoadingSchedules,
    refetch,
  } = useStaffSchedules(startDate, endDate, viewMode);

  // Socket listener for new schedule registration
  useEffect(() => {
    const handleNewScheduleRegistration = (data: {
      userId: string;
      userName?: string;
      schedules: Array<{
        date: string;
        shiftType: string;
        status: string;
      }>;
      message: string;
    }) => {
      console.log("Có nhân viên đăng ký ca mới:", data);

      // Show toast notification
      toast({
        title: "Đăng ký ca mới",
        description:
          data.message ||
          `${data.userName || "Nhân viên"} vừa đăng ký ${
            data.schedules.length
          } ca làm việc`,
        duration: 5000,
      });

      // Refetch schedules to update the table
      refetch();
    };

    onNewScheduleRegistration(handleNewScheduleRegistration);

    return () => {
      offNewScheduleRegistration(handleNewScheduleRegistration);
    };
  }, [onNewScheduleRegistration, offNewScheduleRegistration, refetch, toast]);

  // Filter only staff with role "staff"
  const staffList = users.filter((user: User) => user.role === Role.Staff);

  // Filter staff by search term
  const filteredStaff = staffList.filter(
    (user: User) =>
      (user.name || user.full_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone_number.includes(searchTerm)
  );

  const getUserName = (user: User) => {
    return user.name || user.full_name || "No name";
  };

  // Group schedules by userId, date and shift
  const scheduleMap = useMemo(() => {
    const map = new Map<string, IEmployeeSchedule>();
    if (Array.isArray(schedules)) {
      schedules.forEach((schedule) => {
        // Use shift if available, otherwise use shiftType, normalize "evening" to "afternoon"
        const shift = schedule.shift || schedule.shiftType;
        const normalizedShift = shift === "evening" ? "afternoon" : shift;
        const key = `${schedule.userId}-${schedule.date}-${normalizedShift}`;
        map.set(key, schedule);
      });
    }
    return map;
  }, [schedules]);

  // Get status of a shift
  const getScheduleStatus = (
    userId: string,
    date: Dayjs,
    shift: ShiftType
  ): IEmployeeSchedule | null => {
    const key = `${userId}-${date.format("YYYY-MM-DD")}-${shift}`;
    const schedule = scheduleMap.get(key);

    // If not found, check if there's an "all" shift for this date
    if (!schedule) {
      const allKey = `${userId}-${date.format("YYYY-MM-DD")}-${ShiftType.All}`;
      return scheduleMap.get(allKey) || null;
    }

    return schedule;
  };

  // Check if date is in the past
  const isPastDate = (date: Dayjs): boolean => {
    const today = dayjs().startOf("day");
    return date.startOf("day").isBefore(today);
  };

  // Get color by status
  const getStatusColor = (
    status: EmployeeScheduleStatus | null,
    isPast: boolean
  ): string => {
    if (isPast) {
      if (!status) {
        return "bg-gray-50 border border-gray-200 border-dashed opacity-50 cursor-not-allowed";
      }
      // For past dates with status, keep the status color but make it more muted
      switch (status) {
        case EmployeeScheduleStatus.Approved:
          return "bg-blue-500 opacity-60 cursor-not-allowed";
        case EmployeeScheduleStatus.Completed:
          return "bg-emerald-500 opacity-60 cursor-not-allowed";
        case EmployeeScheduleStatus.InProgress:
          return "bg-purple-500 opacity-60 cursor-not-allowed";
        case EmployeeScheduleStatus.Rejected:
        case EmployeeScheduleStatus.Cancelled:
          return "bg-red-500 opacity-60 cursor-not-allowed";
        case EmployeeScheduleStatus.Absent:
          return "bg-gray-400 opacity-60 cursor-not-allowed";
        case EmployeeScheduleStatus.Pending:
          return "bg-yellow-400 opacity-60 cursor-not-allowed";
        default:
          return "bg-gray-50 border border-gray-200 border-dashed opacity-50 cursor-not-allowed";
      }
    }

    if (!status)
      return "bg-gray-100 border border-gray-300 border-dashed hover:bg-gray-200 hover:border-gray-400";

    switch (status) {
      case EmployeeScheduleStatus.Approved:
        return "bg-blue-500 hover:bg-blue-600";
      case EmployeeScheduleStatus.Completed:
        return "bg-emerald-500 hover:bg-emerald-600";
      case EmployeeScheduleStatus.InProgress:
        return "bg-purple-500 hover:bg-purple-600";
      case EmployeeScheduleStatus.Rejected:
      case EmployeeScheduleStatus.Cancelled:
        return "bg-red-500 hover:bg-red-600";
      case EmployeeScheduleStatus.Absent:
        return "bg-gray-400 hover:bg-gray-500";
      case EmployeeScheduleStatus.Pending:
        return "bg-yellow-400 hover:bg-yellow-500";
      default:
        return "bg-gray-100 border border-gray-300 border-dashed hover:bg-gray-200 hover:border-gray-400";
    }
  };

  const handleStaffClick = (userId: string) => {
    // Navigate to staff earnings detail page
    navigate(PATHS.STAFF_EARNINGS_DETAIL.replace(":userId", userId));
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUserId(null);
    setSelectedStaffName("");
    setInitialDate(undefined);
    setInitialShift(undefined);
    refetch();
  };

  const handleCellClick = (
    schedule: IEmployeeSchedule | null,
    userId: string,
    staffName: string,
    date: Dayjs,
    shift: ShiftType
  ) => {
    if (schedule) {
      // If schedule exists, open detail modal
      setSelectedSchedule(schedule);
      setIsDetailModalOpen(true);
    } else {
      // If no schedule, open registration modal with date and shift pre-filled
      setSelectedUserId(userId);
      setSelectedStaffName(staffName);
      setInitialDate(date.toDate());
      setInitialShift(shift);
      setIsModalOpen(true);
    }
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedSchedule(null);
    refetch();
  };

  const handlePrevious = () => {
    if (viewMode === "week") {
      setCurrentDate(currentDate.subtract(1, "week"));
    } else {
      setCurrentDate(currentDate.subtract(1, "month"));
    }
  };

  const handleNext = () => {
    if (viewMode === "week") {
      setCurrentDate(currentDate.add(1, "week"));
    } else {
      setCurrentDate(currentDate.add(1, "month"));
    }
  };

  const handleToday = () => {
    setCurrentDate(dayjs());
  };

  if (isLoadingUsers || isLoadingSchedules) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Staff Schedule Management</h1>
        <p className="text-gray-600">
          Click on staff name to view earnings details, or click on a cell to
          view/register schedule
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <Tabs
            value={viewMode}
            onValueChange={(value) => setViewMode(value as ViewMode)}
          >
            <TabsList>
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
                  {viewMode === "week"
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
            <Button variant="outline" onClick={handleToday}>
              Today
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full sm:w-[300px]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                rowSpan={2}
                className="min-w-[250px] sticky left-0 bg-white z-10"
              >
                Staff Name
              </TableHead>
              {dates.map((date) => (
                <TableHead
                  key={date.format("YYYY-MM-DD")}
                  colSpan={2}
                  className="text-center"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">
                      {dayNames[date.day()]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {date.format("DD/MM")}
                    </span>
                  </div>
                </TableHead>
              ))}
            </TableRow>
            <TableRow>
              {dates.map((date) => (
                <React.Fragment key={date.format("YYYY-MM-DD")}>
                  <TableHead className="min-w-[80px] text-center text-xs">
                    Sáng
                  </TableHead>
                  <TableHead className="min-w-[80px] text-center text-xs">
                    Chiều
                  </TableHead>
                </React.Fragment>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={dates.length * 2 + 1}
                  className="text-center py-8 text-gray-500"
                >
                  {searchTerm ? "No staff found" : "No staff available"}
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff.map((user: User) => {
                const userName = getUserName(user);
                return (
                  <TableRow key={user._id}>
                    <TableCell
                      className={cn(
                        "min-w-[250px] sticky left-0 bg-white z-10 font-medium",
                        "cursor-pointer hover:text-blue-600 hover:underline py-6"
                      )}
                      onClick={() => handleStaffClick(user._id)}
                    >
                      {userName}
                    </TableCell>
                    {dates.map((date) => {
                      const isPast = isPastDate(date);

                      // Check for "all" shift first
                      const allKey = `${user._id}-${date.format(
                        "YYYY-MM-DD"
                      )}-${ShiftType.All}`;
                      const allSchedule = scheduleMap.get(allKey);

                      // If there's an "all" shift, render merged cell
                      if (allSchedule) {
                        const allStatus = allSchedule.status || null;
                        const allCanClick = true; // All shifts can be clicked to view details

                        const allTooltip = `Ngày: ${date.format("DD/MM/YYYY")}
Ca: Cả ngày
Trạng thái: ${allStatus || "Không có"}${
                          allSchedule.note
                            ? `\nGhi chú: ${allSchedule.note}`
                            : ""
                        }`;

                        return (
                          <React.Fragment key={date.format("YYYY-MM-DD")}>
                            <TableCell
                              colSpan={2}
                              className={cn(
                                "px-2 py-6 text-center min-w-[160px]",
                                getStatusColor(allStatus, isPast),
                                allCanClick &&
                                  "cursor-pointer transition-colors"
                              )}
                              title={allTooltip}
                              onClick={
                                allCanClick
                                  ? () =>
                                      handleCellClick(
                                        allSchedule,
                                        user._id,
                                        userName,
                                        date,
                                        ShiftType.All
                                      )
                                  : undefined
                              }
                            >
                              <span className="text-xs font-medium">
                                Cả ngày
                              </span>
                            </TableCell>
                          </React.Fragment>
                        );
                      }

                      // Otherwise, render separate morning and afternoon cells
                      const morningSchedule = getScheduleStatus(
                        user._id,
                        date,
                        ShiftType.Morning
                      );
                      const morningStatus = morningSchedule?.status || null;
                      const morningCanClick = morningSchedule || !isPast;

                      const afternoonSchedule = getScheduleStatus(
                        user._id,
                        date,
                        ShiftType.Afternoon
                      );
                      const afternoonStatus = afternoonSchedule?.status || null;
                      const afternoonCanClick = afternoonSchedule || !isPast;

                      const morningTooltip = `Ngày: ${date.format("DD/MM/YYYY")}
Ca: Sáng
Trạng thái: ${morningSchedule ? morningStatus || "Không có" : "Chưa đăng ký"}${
                        morningSchedule?.note
                          ? `\nGhi chú: ${morningSchedule.note}`
                          : ""
                      }`;

                      const afternoonTooltip = `Ngày: ${date.format(
                        "DD/MM/YYYY"
                      )}
Ca: Chiều
Trạng thái: ${
                        afternoonSchedule
                          ? afternoonStatus || "Không có"
                          : "Chưa đăng ký"
                      }${
                        afternoonSchedule?.note
                          ? `\nGhi chú: ${afternoonSchedule.note}`
                          : ""
                      }`;

                      return (
                        <React.Fragment key={date.format("YYYY-MM-DD")}>
                          {/* Morning shift cell */}
                          <TableCell
                            className={cn(
                              "px-2 py-6 text-center min-w-[80px] border-r border-gray-300",
                              getStatusColor(morningStatus, isPast),
                              morningCanClick &&
                                "cursor-pointer transition-colors"
                            )}
                            title={morningTooltip}
                            onClick={
                              morningCanClick
                                ? () =>
                                    handleCellClick(
                                      morningSchedule,
                                      user._id,
                                      userName,
                                      date,
                                      ShiftType.Morning
                                    )
                                : undefined
                            }
                          />
                          {/* Afternoon shift cell */}
                          <TableCell
                            className={cn(
                              "px-2 py-6 text-center min-w-[80px]",
                              getStatusColor(afternoonStatus, isPast),
                              afternoonCanClick &&
                                "cursor-pointer transition-colors"
                            )}
                            title={afternoonTooltip}
                            onClick={
                              afternoonCanClick
                                ? () =>
                                    handleCellClick(
                                      afternoonSchedule,
                                      user._id,
                                      userName,
                                      date,
                                      ShiftType.Afternoon
                                    )
                                : undefined
                            }
                          />
                        </React.Fragment>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Registration Modal */}
      {selectedUserId && (
        <StaffScheduleRegistrationModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          userId={selectedUserId}
          staffName={selectedStaffName}
          refetchSchedules={refetch}
          initialDate={initialDate}
          initialShift={initialShift}
        />
      )}

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

export default StaffSchedulePage;
