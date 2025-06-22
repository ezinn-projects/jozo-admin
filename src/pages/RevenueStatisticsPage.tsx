import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface BillItem {
  description: string;
  price: number;
  quantity: number;
  originalPrice?: number;
  discountName?: string;
  discountPercentage?: number;
  promotionId?: string;
}

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
  const [selectedBill, setSelectedBill] = useState<string | null>(null);
  const [billDetailOpen, setBillDetailOpen] = useState<boolean>(false);

  const { data: roomsData } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomApis.getRooms(),
    select: (data) =>
      data.data.result?.reduce((acc, room) => {
        acc[room._id] = room.roomName;
        return acc;
      }, {} as Record<string, string>),
  });

  const { data: billDetail, isLoading: isLoadingBillDetail } = useQuery({
    queryKey: ["billDetail", selectedBill],
    queryFn: () => (selectedBill ? billAPis.getBillById(selectedBill) : null),
    enabled: !!selectedBill,
  });

  const handleBillClick = (billId: string) => {
    setSelectedBill(billId);
    setBillDetailOpen(true);
  };

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
                              <button
                                className="text-blue-600 hover:underline focus:outline-none"
                                onClick={() =>
                                  bill._id && handleBillClick(bill._id)
                                }
                              >
                                {bill.invoiceCode || "N/A"}
                              </button>
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
                              <button
                                className="text-blue-600 hover:underline focus:outline-none"
                                onClick={() =>
                                  bill._id && handleBillClick(bill._id)
                                }
                              >
                                {bill.invoiceCode || "N/A"}
                              </button>
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
                              <button
                                className="text-blue-600 hover:underline focus:outline-none"
                                onClick={() =>
                                  bill._id && handleBillClick(bill._id)
                                }
                              >
                                {bill.invoiceCode || "N/A"}
                              </button>
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

      {/* Modal chi tiết hóa đơn */}
      <Dialog open={billDetailOpen} onOpenChange={setBillDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chi tiết hóa đơn</DialogTitle>
            <DialogDescription>Thông tin chi tiết về hóa đơn</DialogDescription>
          </DialogHeader>
          {isLoadingBillDetail ? (
            <div className="py-6 flex justify-center">
              <Spinner />
            </div>
          ) : billDetail && billDetail.data && billDetail.data.result ? (
            <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 font-mono text-sm">
              <h4 className="text-center text-lg text-purple-700 font-bold mb-2">
                🎉 Jozo Bill 🎉
              </h4>

              <div className="space-y-2 text-gray-800">
                <div className="text-center">
                  <p>
                    Phòng:{" "}
                    <span className="font-bold">
                      {billDetail.data.result.roomName || "N/A"}
                    </span>
                  </p>
                  <p>
                    Loại phòng:{" "}
                    <span className="font-bold">
                      {billDetail.data.result.roomType || "N/A"}
                    </span>
                  </p>
                  <p>
                    Ngày: {billDetail.data.result.formattedCreatedAt || "N/A"}
                  </p>
                  <p>
                    Mã hóa đơn: {billDetail.data.result.invoiceCode || "N/A"}
                  </p>
                </div>

                <div className="border-t-2 border-dashed border-purple-400 my-2" />

                <div>
                  <p>
                    <span className="font-bold">Khách hàng:</span>{" "}
                    {billDetail.data.result.customerName || "N/A"}
                  </p>
                  <p>
                    <span className="font-bold">Thời gian bắt đầu:</span>{" "}
                    {billDetail.data.result.formattedStartTime || "N/A"}
                  </p>
                  <p>
                    <span className="font-bold">Thời gian kết thúc:</span>{" "}
                    {billDetail.data.result.formattedEndTime || "N/A"}
                  </p>
                  <p>
                    <span className="font-bold">Thời lượng sử dụng:</span>{" "}
                    {billDetail.data.result.usageDuration || "0"} giờ
                  </p>
                </div>

                <div className="border-t-2 border-dashed border-purple-400 my-2" />

                {billDetail.data.result.items &&
                billDetail.data.result.items.length > 0 ? (
                  <div>
                    <div className="grid grid-cols-12 font-bold text-purple-600 gap-1">
                      <span className="col-span-5">Tên</span>
                      <span className="col-span-1 text-right">SL</span>
                      <span className="col-span-3 text-right">Đơn Giá</span>
                      <span className="col-span-3 text-right">Thành Tiền</span>
                    </div>
                    {billDetail.data.result.items.map(
                      (item: BillItem, index: number) => (
                        <div key={index}>
                          <div className="grid grid-cols-12 gap-1 py-1">
                            <span className="col-span-5 truncate">
                              {item.description}
                            </span>
                            <span className="col-span-1 text-right">
                              {item.quantity}
                            </span>
                            <span className="col-span-3 text-right">
                              {formatCurrency(item.price)}
                            </span>
                            <span className="col-span-3 text-right">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                          {item.discountName && item.discountPercentage ? (
                            <div className="grid grid-cols-12 gap-1 text-xs text-green-600 italic py-1">
                              <span className="col-span-9 pl-4">
                                - {item.discountName} ({item.discountPercentage}
                                %)
                              </span>
                              <span className="col-span-3 text-right">
                                -
                                {formatCurrency(
                                  ((item.originalPrice || item.price) *
                                    item.quantity *
                                    (item.discountPercentage || 0)) /
                                    100
                                )}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-center italic">
                    Không có chi tiết đơn hàng
                  </p>
                )}

                <div className="border-t-2 border-dashed border-purple-400 my-2" />

                <div>
                  <p>
                    <span className="font-bold">Phương thức thanh toán:</span>{" "}
                    {billDetail.data.result.paymentMethod || "N/A"}
                  </p>
                  <p className="text-right font-bold text-lg text-green-600">
                    Tổng tiền:{" "}
                    {formatCurrency(billDetail.data.result.totalAmount || 0)}{" "}
                    VNĐ
                  </p>
                </div>

                <div className="border-t-2 border-dashed border-purple-400 my-2" />

                <div className="text-center">
                  <p className="text-purple-700 font-bold">Jozo - Vui Hết Ý!</p>
                  <p className="text-sm italic">Hẹn gặp lại nhé! 😉</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-red-500">
              Không thể tải thông tin hóa đơn
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RevenueStatisticsPage;
