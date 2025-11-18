import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmployeeScheduleStatus } from "@/constants/enum";
import PATHS from "@/constants/paths";
import { useMySchedules } from "@/hooks/use-my-schedules";
import dayjs, { Dayjs } from "dayjs";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  Download,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const MyEarningsDetailPage = () => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
  const hourlyRate = 22000; // 22k VND per hour

  // Calculate startDate and endDate from selected month
  const startDate = useMemo(
    () => selectedMonth.startOf("month"),
    [selectedMonth]
  );
  const endDate = useMemo(() => selectedMonth.endOf("month"), [selectedMonth]);

  // Get all schedules for selected month (approved, completed, absent, etc.)
  const { data: { schedules = [] } = { schedules: [] }, isLoading } =
    useMySchedules({
      filterType: "month",
      startDate,
      endDate,
      // No status filter - get all schedules
    });

  // Calculate detailed earnings data for entire month
  const earningsData = useMemo(() => {
    // Get total days in selected month
    const daysInMonth = selectedMonth.daysInMonth();

    // Create a map of schedules by date
    const schedulesByDate = new Map<string, typeof schedules>();
    schedules.forEach((schedule) => {
      const dateKey = dayjs(schedule.date).format("YYYY-MM-DD");
      if (!schedulesByDate.has(dateKey)) {
        schedulesByDate.set(dateKey, []);
      }
      schedulesByDate.get(dateKey)!.push(schedule);
    });

    // Generate data for all days in month
    const data: Array<{
      date: Dayjs;
      startTime: string;
      endTime: string;
      hours: number;
      salary: number;
      status: EmployeeScheduleStatus | "not-registered";
      schedule?: (typeof schedules)[0];
    }> = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = selectedMonth.date(day);
      const dateKey = currentDate.format("YYYY-MM-DD");
      const daySchedules = schedulesByDate.get(dateKey) || [];

      if (daySchedules.length === 0) {
        // No schedule registered for this day
        data.push({
          date: currentDate,
          startTime: "-",
          endTime: "-",
          hours: 0,
          salary: 0,
          status: "not-registered" as const,
        });
      } else {
        // Has schedule(s) for this day
        daySchedules.forEach((schedule) => {
          let hours = 0;
          let startTime = "";
          let endTime = "";

          if (schedule.customStartTime && schedule.customEndTime) {
            startTime = schedule.customStartTime;
            endTime = schedule.customEndTime;

            const [startHour, startMin] = schedule.customStartTime
              .split(":")
              .map(Number);
            const [endHour, endMin] = schedule.customEndTime
              .split(":")
              .map(Number);
            const startTotal = startHour * 60 + startMin;
            const endTotal = endHour * 60 + endMin;
            const diffMinutes = endTotal - startTotal;
            hours = diffMinutes / 60;
          } else {
            const shift = schedule.shift || schedule.shiftType;
            if (shift === "morning") {
              startTime = "12:00";
              endTime = "17:00";
              hours = 5;
            } else if (shift === "afternoon") {
              startTime = "17:00";
              endTime = "22:00";
              hours = 5;
            } else if (shift === "all") {
              startTime = "12:00";
              endTime = "22:00";
              hours = 10;
            } else {
              hours = 5;
              startTime = "N/A";
              endTime = "N/A";
            }
          }

          // Only count salary for completed shifts
          const salary =
            schedule.status === EmployeeScheduleStatus.Completed
              ? hours * hourlyRate
              : 0;

          data.push({
            date: currentDate,
            startTime,
            endTime,
            hours: Math.round(hours * 10) / 10,
            salary,
            status: schedule.status,
            schedule,
          });
        });
      }
    }

    // Sort by date (oldest first for display)
    data.sort((a, b) => a.date.valueOf() - b.date.valueOf());

    // Calculate totals (only completed shifts)
    const completedItems = data.filter(
      (item) => item.status === EmployeeScheduleStatus.Completed
    );
    const totalHours = completedItems.reduce(
      (sum, item) => sum + item.hours,
      0
    );
    const totalSalary = completedItems.reduce(
      (sum, item) => sum + item.salary,
      0
    );
    const totalRegistered = data.filter(
      (item) => item.status !== "not-registered"
    ).length;

    return {
      items: data,
      totalHours: Math.round(totalHours * 10) / 10,
      totalSalary,
      totalShifts: completedItems.length,
      totalRegistered,
    };
  }, [schedules, hourlyRate, selectedMonth]);

  // Generate month options (current month and 11 previous months)
  const monthOptions = useMemo(() => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const month = dayjs().subtract(i, "month");
      options.push(month);
    }
    return options;
  }, []);

  const handleExportCSV = () => {
    // Prepare CSV content
    const headers = [
      "Ngày làm",
      "Giờ bắt đầu",
      "Giờ kết thúc",
      "Số giờ",
      "Lương (VND)",
      "Trạng thái",
    ];
    const rows = earningsData.items.map((item) => {
      const status =
        item.status === "not-registered"
          ? "Chưa đăng ký"
          : item.status === EmployeeScheduleStatus.Absent
          ? "Vắng mặt"
          : item.status === EmployeeScheduleStatus.Completed
          ? "Hoàn thành"
          : item.status === EmployeeScheduleStatus.Approved
          ? "Đã duyệt"
          : item.status === EmployeeScheduleStatus.Pending
          ? "Chờ duyệt"
          : item.status;

      return [
        item.date.format("DD/MM/YYYY"),
        item.status === "not-registered" ? "✕" : item.startTime,
        item.status === "not-registered" ? "✕" : item.endTime,
        item.status === "not-registered" ? "✕" : item.hours.toString(),
        item.status === "not-registered"
          ? "✕"
          : item.status === EmployeeScheduleStatus.Completed
          ? item.salary.toString()
          : "-",
        status,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
      "", // Empty row
      `Tổng ca đăng ký,,,,${earningsData.totalRegistered},`,
      `Tổng ca hoàn thành,,,,${earningsData.totalShifts},`,
      `Tổng số giờ,,,,${earningsData.totalHours},`,
      `Tổng thực nhận,,,,"${earningsData.totalSalary}",`,
    ].join("\n");

    // Create and download file
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `earnings_${selectedMonth.format("MM_YYYY")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(PATHS.MY_SCHEDULE)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="md:text-3xl text-xl font-bold flex items-center gap-2">
              <DollarSign className="h-8 w-8" />
              Chi Tiết Lương
            </h1>
            <p className="text-muted-foreground mt-1">
              Thống kê chi tiết các ca làm việc và lương thực nhận
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng Thực Nhận
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {earningsData.totalSalary.toLocaleString("vi-VN")}₫
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedMonth.format("MM/YYYY")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ca Đã Đăng Ký</CardTitle>
            <CalendarIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {earningsData.totalRegistered}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {earningsData.totalShifts} ca hoàn thành
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Giờ Làm</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {earningsData.totalHours}h
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              giờ làm việc thực tế
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Export */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ Lọc</CardTitle>
          <CardDescription>
            Chọn tháng để xem chi tiết thu nhập và ca làm việc
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <Select
              value={selectedMonth.format("YYYY-MM")}
              onValueChange={(value) => setSelectedMonth(dayjs(value))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Chọn tháng" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((month) => (
                  <SelectItem
                    key={month.format("YYYY-MM")}
                    value={month.format("YYYY-MM")}
                  >
                    {month.format("MM/YYYY")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={earningsData.items.length === 0}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Xuất CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Chi Tiết Ca Làm Việc</CardTitle>
          <CardDescription>
            Danh sách tất cả các ca làm việc đã hoàn thành trong tháng{" "}
            {selectedMonth.format("MM/YYYY")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : earningsData.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Không có ca làm việc nào
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Bạn chưa hoàn thành ca làm việc nào trong tháng này
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">STT</TableHead>
                    <TableHead>Ngày Làm</TableHead>
                    <TableHead>Thứ</TableHead>
                    <TableHead>Giờ Bắt Đầu</TableHead>
                    <TableHead>Giờ Kết Thúc</TableHead>
                    <TableHead className="text-right">Số Giờ</TableHead>
                    <TableHead className="text-right">Lương (VND)</TableHead>
                    <TableHead>Trạng Thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earningsData.items.map((item, index) => {
                    const isNotRegistered = item.status === "not-registered";
                    const isAbsent =
                      item.status === EmployeeScheduleStatus.Absent;
                    const isCompleted =
                      item.status === EmployeeScheduleStatus.Completed;
                    const isPending =
                      item.status === EmployeeScheduleStatus.Pending;
                    const isApproved =
                      item.status === EmployeeScheduleStatus.Approved;

                    return (
                      <TableRow
                        key={`${item.date.format("YYYY-MM-DD")}-${index}`}
                        className={
                          isNotRegistered
                            ? "bg-gray-50"
                            : isAbsent
                            ? "bg-red-50"
                            : ""
                        }
                      >
                        <TableCell className="font-medium">
                          {index + 1}
                        </TableCell>
                        <TableCell>{item.date.format("DD/MM/YYYY")}</TableCell>
                        <TableCell>
                          {item.date.format("dddd") === "Monday"
                            ? "Thứ 2"
                            : item.date.format("dddd") === "Tuesday"
                            ? "Thứ 3"
                            : item.date.format("dddd") === "Wednesday"
                            ? "Thứ 4"
                            : item.date.format("dddd") === "Thursday"
                            ? "Thứ 5"
                            : item.date.format("dddd") === "Friday"
                            ? "Thứ 6"
                            : item.date.format("dddd") === "Saturday"
                            ? "Thứ 7"
                            : "Chủ Nhật"}
                        </TableCell>
                        <TableCell
                          className={`font-medium ${
                            isNotRegistered ? "text-gray-400" : ""
                          }`}
                        >
                          {isNotRegistered ? "✕" : item.startTime}
                        </TableCell>
                        <TableCell
                          className={`font-medium ${
                            isNotRegistered ? "text-gray-400" : ""
                          }`}
                        >
                          {isNotRegistered ? "✕" : item.endTime}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            isNotRegistered ? "text-gray-400" : ""
                          }`}
                        >
                          {isNotRegistered ? "✕" : `${item.hours}h`}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            isCompleted
                              ? "text-green-600"
                              : isNotRegistered
                              ? "text-gray-400"
                              : "text-gray-500"
                          }`}
                        >
                          {isNotRegistered
                            ? "✕"
                            : isCompleted
                            ? `${item.salary.toLocaleString("vi-VN")}₫`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {isNotRegistered ? (
                            <Badge
                              variant="outline"
                              className="bg-gray-100 text-gray-600 border-gray-300"
                            >
                              Chưa đăng ký
                            </Badge>
                          ) : isAbsent ? (
                            <Badge
                              variant="outline"
                              className="bg-red-100 text-red-700 border-red-300"
                            >
                              🔴 Vắng mặt
                            </Badge>
                          ) : isCompleted ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                              Hoàn thành
                            </Badge>
                          ) : isPending ? (
                            <Badge
                              variant="outline"
                              className="bg-yellow-100 text-yellow-800 border-yellow-300"
                            >
                              Chờ duyệt
                            </Badge>
                          ) : isApproved ? (
                            <Badge
                              variant="outline"
                              className="bg-blue-100 text-blue-800 border-blue-300"
                            >
                              Đã duyệt
                            </Badge>
                          ) : (
                            <Badge variant="outline">{item.status}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {/* Summary Row */}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={5} className="text-right">
                      Tổng Cộng:
                    </TableCell>
                    <TableCell className="text-right text-lg">
                      {earningsData.totalHours}h
                    </TableCell>
                    <TableCell className="text-right text-lg text-green-600">
                      {earningsData.totalSalary.toLocaleString("vi-VN")}₫
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyEarningsDetailPage;
