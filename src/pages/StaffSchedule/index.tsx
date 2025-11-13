import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { useUsers } from "@/hooks/use-users";
import { User } from "@/@types/user";
import { Role, EmployeeScheduleStatus, ShiftType } from "@/constants/enum";
import StaffScheduleRegistrationModal from "@/pages/RoomSchedule/components/StaffScheduleRegistrationModal";
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
  const [searchTerm, setSearchTerm] = useState("");

  const { users, isLoadingUsers } = useUsers();

  // Tính toán startDate và endDate dựa trên viewMode và currentDate
  const { startDate, endDate, dates } = useMemo(() => {
    let start: Dayjs;
    let end: Dayjs;
    const dateList: Dayjs[] = [];

    if (viewMode === "week") {
      // Lấy thứ 2 của tuần (dayjs mặc định chủ nhật là đầu tuần, nên thứ 2 = day 1)
      const dayOfWeek = currentDate.day(); // 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7
      if (dayOfWeek === 0) {
        // Nếu là chủ nhật, lùi về thứ 2 tuần trước
        start = currentDate.subtract(6, "day");
      } else {
        // Tính số ngày cần lùi để về thứ 2 (day 1)
        const daysToSubtract = dayOfWeek - 1;
        start = currentDate.subtract(daysToSubtract, "day");
      }
      end = start.add(6, "day");

      // Tạo danh sách 7 ngày
      for (let i = 0; i < 7; i++) {
        dateList.push(start.add(i, "day"));
      }
    } else {
      // Month view
      start = currentDate.startOf("month");
      end = currentDate.endOf("month");

      // Tạo danh sách tất cả ngày trong tháng
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

  // Lọc chỉ staff có role "staff"
  const staffList = users.filter((user: User) => user.role === Role.Staff);

  // Lọc staff theo search term
  const filteredStaff = staffList.filter(
    (user: User) =>
      (user.name || user.full_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone_number.includes(searchTerm)
  );

  const getUserName = (user: User) => {
    return user.name || user.full_name || "Không có tên";
  };

  // Group schedules theo userId, date và shift
  const scheduleMap = useMemo(() => {
    const map = new Map<string, IEmployeeSchedule>();
    if (Array.isArray(schedules)) {
      schedules.forEach((schedule) => {
        const key = `${schedule.userId}-${schedule.date}-${schedule.shift}`;
        map.set(key, schedule);
      });
    }
    return map;
  }, [schedules]);

  // Lấy trạng thái của một ca làm việc
  const getScheduleStatus = (
    userId: string,
    date: Dayjs,
    shift: ShiftType
  ): IEmployeeSchedule | null => {
    const key = `${userId}-${date.format("YYYY-MM-DD")}-${shift}`;
    return scheduleMap.get(key) || null;
  };

  // Lấy màu sắc theo trạng thái
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
        <div className="text-lg">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          Quản lý lịch làm của nhân viên
        </h1>
        <p className="text-gray-600">
          Click vào tên nhân viên để đăng ký lịch làm
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
              Hôm nay
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Tìm kiếm nhân viên..."
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
                Tên nhân viên
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
                  {searchTerm
                    ? "Không tìm thấy nhân viên nào"
                    : "Chưa có nhân viên nào"}
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff.map((user: User) => {
                const userName = getUserName(user);
                return (
                  <>
                    {/* Hàng ca sáng */}
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
                          />
                        );
                      })}
                    </TableRow>
                    {/* Hàng ca chiều */}
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
    </div>
  );
};

export default StaffSchedulePage;
