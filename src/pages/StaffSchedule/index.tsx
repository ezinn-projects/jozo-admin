import { useState, useMemo } from "react";
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
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

const StaffSchedulePage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedStaffName, setSelectedStaffName] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] =
    useState<IEmployeeSchedule | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { users, isLoadingUsers } = useUsers();

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
    return scheduleMap.get(key) || null;
  };

  // Get color by status
  const getStatusColor = (status: EmployeeScheduleStatus | null): string => {
    if (!status) return "bg-white border border-gray-200";

    switch (status) {
      case EmployeeScheduleStatus.Approved:
      case EmployeeScheduleStatus.InProgress:
      case EmployeeScheduleStatus.Completed:
        return "bg-green-500 hover:bg-green-600";
      case EmployeeScheduleStatus.Rejected:
      case EmployeeScheduleStatus.Cancelled:
      case EmployeeScheduleStatus.Absent:
        return "bg-gray-400 hover:bg-gray-500";
      case EmployeeScheduleStatus.Pending:
        return "bg-yellow-400 hover:bg-yellow-500";
      default:
        return "bg-white border border-gray-200";
    }
  };

  const handleStaffClick = (userId: string, staffName: string) => {
    setSelectedUserId(userId);
    setSelectedStaffName(staffName);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUserId(null);
    setSelectedStaffName("");
    refetch();
  };

  const handleCellClick = (
    schedule: IEmployeeSchedule | null,
    userId: string,
    staffName: string
  ) => {
    if (schedule) {
      // If schedule exists, open detail modal
      setSelectedSchedule(schedule);
      setIsDetailModalOpen(true);
    } else {
      // If no schedule, open registration modal
      handleStaffClick(userId, staffName);
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
          Click on staff name to register schedule, or click on a scheduled cell
          to view details
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
              <TableHead className="min-w-[250px] sticky left-0 bg-white z-10">
                Staff Name
              </TableHead>
              {dates.map((date) => (
                <TableHead
                  key={date.format("YYYY-MM-DD")}
                  className="min-w-[100px] text-center"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">
                      {format(date.toDate(), "EEE", { locale: vi })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {date.format("DD/MM")}
                    </span>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={dates.length + 1}
                  className="text-center py-8 text-gray-500"
                >
                  {searchTerm ? "No staff found" : "No staff available"}
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff.map((user: User) => {
                const userName = getUserName(user);
                return (
                  <>
                    {/* Morning shift row */}
                    <TableRow key={`${user._id}-${ShiftType.Morning}`}>
                      <TableCell
                        rowSpan={2}
                        className={cn(
                          "min-w-[250px] sticky left-0 bg-white z-10 font-medium",
                          "cursor-pointer hover:text-blue-600 hover:underline py-6"
                        )}
                        onClick={() => handleStaffClick(user._id, userName)}
                      >
                        {userName}
                      </TableCell>
                      {dates.map((date) => {
                        const schedule = getScheduleStatus(
                          user._id,
                          date,
                          ShiftType.Morning
                        );
                        const status = schedule?.status || null;
                        return (
                          <TableCell
                            key={`${user._id}-${date.format("YYYY-MM-DD")}-${
                              ShiftType.Morning
                            }`}
                            className={cn(
                              "px-2 py-6 text-center",
                              getStatusColor(status),
                              "cursor-pointer transition-colors"
                            )}
                            title={schedule?.note || ""}
                            onClick={() =>
                              handleCellClick(schedule, user._id, userName)
                            }
                          />
                        );
                      })}
                    </TableRow>
                    {/* Afternoon shift row */}
                    <TableRow key={`${user._id}-${ShiftType.Afternoon}`}>
                      {dates.map((date) => {
                        const schedule = getScheduleStatus(
                          user._id,
                          date,
                          ShiftType.Afternoon
                        );
                        const status = schedule?.status || null;
                        return (
                          <TableCell
                            key={`${user._id}-${date.format("YYYY-MM-DD")}-${
                              ShiftType.Afternoon
                            }`}
                            className={cn(
                              "px-2 py-6 text-center",
                              getStatusColor(status),
                              "cursor-pointer transition-colors"
                            )}
                            title={schedule?.note || ""}
                            onClick={() =>
                              handleCellClick(schedule, user._id, userName)
                            }
                          />
                        );
                      })}
                    </TableRow>
                  </>
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
