import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Typography from "@/components/ui/typography";
import billAPis from "@/apis/bill.apis";
import dayjs from "dayjs";
// import { formatCurrency } from "@/utils/formatters";
import { IBill } from "@/@types/Bill";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { useQuery } from "@tanstack/react-query";
import roomApis from "@/apis/room.apis";

interface DateInfo {
  date?: string;
  formattedDate?: string;
  week?: number;
  year?: number;
  dateRange?: string;
  startDate?: Date;
  endDate?: Date;
  month?: string;
}

type RevenueData = {
  loading: boolean;
  error: string | null;
  data: {
    totalRevenue: number;
    billCount: number;
    bills: IBill[];
    dateInfo: DateInfo;
  } | null;
};

const RevenueStatisticsPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<string>("daily");

  const { data: roomsData } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomApis.getRooms(),
    select: (data) =>
      data.data.result?.reduce((acc, room) => {
        acc[room._id] = room.roomName;
        return acc;
      }, {} as Record<string, string>),
  });

  console.log("roomsData", roomsData);

  const [dailyRevenue, setDailyRevenue] = useState<RevenueData>({
    loading: false,
    error: null,
    data: null,
  });

  const [weeklyRevenue, setWeeklyRevenue] = useState<RevenueData>({
    loading: false,
    error: null,
    data: null,
  });

  const [monthlyRevenue, setMonthlyRevenue] = useState<RevenueData>({
    loading: false,
    error: null,
    data: null,
  });

  const fetchDailyRevenue = async () => {
    setDailyRevenue({ ...dailyRevenue, loading: true, error: null });
    try {
      const isoDate = dayjs(selectedDate).toISOString();
      const response = await billAPis.getDailyRevenue(isoDate);

      if (response && response.data && response.data.result) {
        setDailyRevenue({
          loading: false,
          error: null,
          data: {
            totalRevenue: response.data.result.totalRevenue,
            billCount: response.data.result.billCount,
            bills: response.data.result.bills,
            dateInfo: {
              date: response.data.result.date,
              formattedDate: response.data.result.formattedDate,
            },
          },
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi tải dữ liệu doanh thu ngày";
      setDailyRevenue({
        loading: false,
        error: errorMessage,
        data: null,
      });
    }
  };

  const fetchWeeklyRevenue = async () => {
    setWeeklyRevenue({ ...weeklyRevenue, loading: true, error: null });
    try {
      const isoDate = dayjs(selectedDate).toISOString();
      const response = await billAPis.getWeeklyRevenue(isoDate);

      if (response && response.data && response.data.result) {
        setWeeklyRevenue({
          loading: false,
          error: null,
          data: {
            totalRevenue: response.data.result.totalRevenue,
            billCount: response.data.result.billCount,
            bills: response.data.result.bills,
            dateInfo: {
              week: response.data.result.week,
              year: response.data.result.year,
              dateRange: response.data.result.dateRange,
              startDate: response.data.result.startDate,
              endDate: response.data.result.endDate,
            },
          },
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi tải dữ liệu doanh thu tuần";
      setWeeklyRevenue({
        loading: false,
        error: errorMessage,
        data: null,
      });
    }
  };

  const fetchMonthlyRevenue = async () => {
    setMonthlyRevenue({ ...monthlyRevenue, loading: true, error: null });
    try {
      const isoDate = dayjs(selectedDate).toISOString();
      const response = await billAPis.getMonthlyRevenue(isoDate);

      if (response && response.data && response.data.result) {
        setMonthlyRevenue({
          loading: false,
          error: null,
          data: {
            totalRevenue: response.data.result.totalRevenue,
            billCount: response.data.result.billCount,
            bills: response.data.result.bills,
            dateInfo: {
              month: response.data.result.month,
              year: response.data.result.year,
              dateRange: response.data.result.dateRange,
              startDate: response.data.result.startDate,
              endDate: response.data.result.endDate,
            },
          },
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi tải dữ liệu doanh thu tháng";
      setMonthlyRevenue({
        loading: false,
        error: errorMessage,
        data: null,
      });
    }
  };

  useEffect(() => {
    if (activeTab === "daily") {
      fetchDailyRevenue();
    } else if (activeTab === "weekly") {
      fetchWeeklyRevenue();
    } else if (activeTab === "monthly") {
      fetchMonthlyRevenue();
    }
  }, [selectedDate, activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const formatBillDate = (dateString: string) => {
    return dayjs(dateString).format("DD/MM/YYYY HH:mm");
  };

  return (
    <div className="container mx-auto p-4">
      <Typography variant="h1" className="mb-6">
        Thống kê doanh thu
      </Typography>

      <div className="flex gap-4 mb-6 items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              {dayjs(selectedDate).format("DD/MM/YYYY")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Button
          onClick={() => {
            if (activeTab === "daily") fetchDailyRevenue();
            else if (activeTab === "weekly") fetchWeeklyRevenue();
            else if (activeTab === "monthly") fetchMonthlyRevenue();
          }}
        >
          Cập nhật dữ liệu
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="daily">Doanh thu ngày</TabsTrigger>
          <TabsTrigger value="weekly">Doanh thu tuần</TabsTrigger>
          <TabsTrigger value="monthly">Doanh thu tháng</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          {dailyRevenue.loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner />
            </div>
          ) : dailyRevenue.error ? (
            <div className="text-red-500 p-4 text-center">
              {dailyRevenue.error}
            </div>
          ) : dailyRevenue.data ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Ngày</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Typography variant="h4">
                      {dailyRevenue.data.dateInfo.formattedDate}
                    </Typography>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Tổng doanh thu
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Typography variant="h4" className="text-green-600">
                      {formatCurrency(dailyRevenue.data.totalRevenue)} VNĐ
                    </Typography>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Số lượng hóa đơn
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Typography variant="h4">
                      {dailyRevenue.data.billCount}
                    </Typography>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Chi tiết hóa đơn</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã hóa đơn</TableHead>
                          <TableHead>Thời gian</TableHead>
                          <TableHead>Phòng</TableHead>
                          <TableHead className="text-right">Số tiền</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dailyRevenue.data.bills.map((bill) => (
                          <TableRow key={bill._id || "unknown"}>
                            <TableCell className="font-medium">
                              {bill._id ? bill._id.slice(-6) : "N/A"}
                            </TableCell>
                            <TableCell>
                              {formatBillDate(bill.createdAt.toString())}
                            </TableCell>
                            <TableCell>
                              {roomsData?.[bill.roomId] || bill.roomId || "N/A"}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(bill.totalAmount)} VNĐ
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center p-8">
              Chọn ngày và nhấn "Cập nhật dữ liệu" để xem thống kê
            </div>
          )}
        </TabsContent>

        <TabsContent value="weekly">
          {weeklyRevenue.loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner />
            </div>
          ) : weeklyRevenue.error ? (
            <div className="text-red-500 p-4 text-center">
              {weeklyRevenue.error}
            </div>
          ) : weeklyRevenue.data ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Tuần / Năm
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Typography variant="h4">
                      Tuần {weeklyRevenue.data.dateInfo.week},{" "}
                      {weeklyRevenue.data.dateInfo.year}
                    </Typography>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Khoảng thời gian
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Typography variant="h5">
                      {weeklyRevenue.data.dateInfo.dateRange}
                    </Typography>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Tổng doanh thu
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Typography variant="h4" className="text-green-600">
                      {formatCurrency(weeklyRevenue.data.totalRevenue)} VNĐ
                    </Typography>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Số lượng hóa đơn
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Typography variant="h4">
                      {weeklyRevenue.data.billCount}
                    </Typography>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Chi tiết hóa đơn</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã hóa đơn</TableHead>
                          <TableHead>Thời gian</TableHead>
                          <TableHead>Phòng</TableHead>
                          <TableHead className="text-right">Số tiền</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {weeklyRevenue.data.bills.map((bill) => (
                          <TableRow key={bill._id || "unknown"}>
                            <TableCell className="font-medium">
                              {bill._id ? bill._id.slice(-6) : "N/A"}
                            </TableCell>
                            <TableCell>
                              {formatBillDate(bill.createdAt.toString())}
                            </TableCell>
                            <TableCell>
                              {roomsData?.[bill.roomId] || bill.roomId || "N/A"}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(bill.totalAmount)} VNĐ
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center p-8">
              Chọn ngày trong tuần và nhấn "Cập nhật dữ liệu" để xem thống kê
            </div>
          )}
        </TabsContent>

        <TabsContent value="monthly">
          {monthlyRevenue.loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner />
            </div>
          ) : monthlyRevenue.error ? (
            <div className="text-red-500 p-4 text-center">
              {monthlyRevenue.error}
            </div>
          ) : monthlyRevenue.data ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Tháng / Năm
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Typography variant="h4">
                      {monthlyRevenue.data.dateInfo.month}{" "}
                      {monthlyRevenue.data.dateInfo.year}
                    </Typography>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Khoảng thời gian
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Typography variant="h5">
                      {monthlyRevenue.data.dateInfo.dateRange}
                    </Typography>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Tổng doanh thu
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Typography variant="h4" className="text-green-600">
                      {formatCurrency(monthlyRevenue.data.totalRevenue)} VNĐ
                    </Typography>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Số lượng hóa đơn
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Typography variant="h4">
                      {monthlyRevenue.data.billCount}
                    </Typography>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Chi tiết hóa đơn</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã hóa đơn</TableHead>
                          <TableHead>Thời gian</TableHead>
                          <TableHead>Phòng</TableHead>
                          <TableHead className="text-right">Số tiền</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {monthlyRevenue.data.bills.map((bill) => (
                          <TableRow key={bill._id || "unknown"}>
                            <TableCell className="font-medium">
                              {bill._id ? bill._id.slice(-6) : "N/A"}
                            </TableCell>
                            <TableCell>
                              {formatBillDate(bill.createdAt.toString())}
                            </TableCell>
                            <TableCell>
                              {roomsData?.[bill.roomId] || bill.roomId || "N/A"}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(bill.totalAmount)} VNĐ
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center p-8">
              Chọn ngày trong tháng và nhấn "Cập nhật dữ liệu" để xem thống kê
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RevenueStatisticsPage;
