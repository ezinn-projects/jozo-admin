import { PageHeader } from "@/components/shared";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Spinner } from "@/components/ui/spinner";
import { TrendingUp } from "lucide-react";
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
import dayjs from "@/lib/dayjs";
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
import { useIsStaff } from "@/hooks/usePermission";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BillItem {
  description: string;
  price: number;
  quantity: number;
  originalPrice?: number;
  discountName?: string;
  discountPercentage?: number;
  promotionId?: string;
}

const paymentMethodMap: Record<string, string> = {
  cash: "Tiền mặt",
  Cash: "Tiền mặt",
  CASH: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
  Bank_Transfer: "Chuyển khoản",
  BANK_TRANSFER: "Chuyển khoản",
  "bank transfer": "Chuyển khoản",
  "Bank Transfer": "Chuyển khoản",
  "BANK TRANSFER": "Chuyển khoản",
  transfer: "Chuyển khoản",
  Transfer: "Chuyển khoản",
  TRANSFER: "Chuyển khoản",
  momo: "MoMo",
  MoMo: "MoMo",
  MOMO: "MoMo",
  zalo_pay: "Zalo Pay",
  Zalo_Pay: "Zalo Pay",
  ZALO_PAY: "Zalo Pay",
  vnpay: "VNPay",
  VNPay: "VNPay",
  VNPAY: "VNPay",
  visa: "Visa",
  Visa: "Visa",
  VISA: "Visa",
  mastercard: "Mastercard",
  Mastercard: "Mastercard",
  MASTERCARD: "Mastercard",
};

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
    bills: RevenueBill[];
    dateInfo: DateInfo;
  } | null;
};

type RevenueBill = IBill & {
  completedBy?: string;
  createdBy?: string;
};

const RevenueStatisticsPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<string>("daily");
  const [selectedBill, setSelectedBill] = useState<string | null>(null);
  const [billDetailOpen, setBillDetailOpen] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("all");
  const isStaff = useIsStaff();

  // Đảm bảo staff chỉ có thể xem tab "daily"
  useEffect(() => {
    if (isStaff && activeTab !== "daily") {
      setActiveTab("daily");
    }
  }, [isStaff, activeTab]);

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
      // Send date in ISO format (UTC) - backend will handle timezone
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
      // Send date in ISO format (UTC) - backend will handle timezone
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
      // Send date in ISO format (UTC) - backend will handle timezone
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
    // Nếu là staff, chỉ cho phép tab "daily"
    if (isStaff && value !== "daily") {
      return;
    }
    setActiveTab(value);
    // Reset filter khi chuyển tab
    setSelectedPaymentMethod("all");
  };

  const formatBillDate = (dateString: string) => {
    // Parse UTC date and convert to Vietnam timezone for display
    return dayjs
      .utc(dateString)
      .tz("Asia/Ho_Chi_Minh")
      .format("DD/MM/YYYY HH:mm");
  };

  const sortBillsByEndTimeDesc = (bills: RevenueBill[]) => {
    return [...bills].sort((a, b) => {
      const endTimeA = dayjs(a.endTime).valueOf();
      const endTimeB = dayjs(b.endTime).valueOf();

      return endTimeB - endTimeA;
    });
  };

  const formatPaymentMethod = (method: string) => {
    return paymentMethodMap[method] || method;
  };

  // Lọc bills theo paymentMethod
  const filterBillsByPaymentMethod = (bills: RevenueBill[]) => {
    if (selectedPaymentMethod === "all") return bills;
    // value có thể là nhiều methods phân cách bởi dấu phẩy
    const methods = selectedPaymentMethod.split(",");
    return bills.filter((bill) => methods.includes(bill.paymentMethod));
  };

  // Lấy tất cả các payment methods để hiển thị trong filter (không phụ thuộc vào dữ liệu)
  const getAllPaymentMethodOptions = () => {
    const methods = [
      { value: ["cash", "Cash", "CASH"], label: "Tiền mặt" },
      {
        value: [
          "bank_transfer",
          "Bank_Transfer",
          "BANK_TRANSFER",
          "bank transfer",
          "Bank Transfer",
          "BANK TRANSFER",
          "transfer",
          "Transfer",
          "TRANSFER",
        ],
        label: "Chuyển khoản",
      },
      { value: ["momo", "MoMo", "MOMO"], label: "MoMo" },
      { value: ["zalo_pay", "Zalo_Pay", "ZALO_PAY"], label: "Zalo Pay" },
      { value: ["vnpay", "VNPay", "VNPAY"], label: "VNPay" },
      { value: ["visa", "Visa", "VISA"], label: "Visa" },
      {
        value: ["mastercard", "Mastercard", "MASTERCARD"],
        label: "Mastercard",
      },
    ];

    return methods.map((opt) => ({
      value: opt.value.join(","),
      label: opt.label,
    }));
  };

  // Tính lại tổng doanh thu và số lượng hóa đơn sau khi filter
  const calculateFilteredStats = (bills: RevenueBill[]) => {
    const filteredBills = sortBillsByEndTimeDesc(
      filterBillsByPaymentMethod(bills)
    );
    const totalRevenue = filteredBills.reduce(
      (sum, bill) => sum + bill.totalAmount,
      0
    );
    const billCount = filteredBills.length;
    return { filteredBills, totalRevenue, billCount };
  };

  return (
    <div className="!p-4 space-y-6">
      <PageHeader
        title="Thống kê doanh thu"
        description="Xem và phân tích doanh thu theo ngày, tuần và tháng"
        icon={TrendingUp}
      />

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
        <div className="flex justify-between items-center mb-6">
          <TabsList className={isStaff ? "" : "grid grid-cols-3"}>
            <TabsTrigger value="daily">Doanh thu ngày</TabsTrigger>
            {!isStaff && (
              <>
                <TabsTrigger value="weekly">Doanh thu tuần</TabsTrigger>
                <TabsTrigger value="monthly">Doanh thu tháng</TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Filter payment method */}
          {(dailyRevenue.data?.bills ||
            weeklyRevenue.data?.bills ||
            monthlyRevenue.data?.bills) && (
            <Select
              value={selectedPaymentMethod}
              onValueChange={setSelectedPaymentMethod}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Lọc theo PT thanh toán" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {getAllPaymentMethodOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

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
            (() => {
              const { filteredBills, totalRevenue, billCount } =
                calculateFilteredStats(dailyRevenue.data.bills);
              return (
                <div className="space-y-6">
                  <div
                    className={`grid grid-cols-1 gap-4 ${
                      isStaff ? "md:grid-cols-2" : "md:grid-cols-3"
                    }`}
                  >
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Ngày
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Typography variant="h4">
                          {dailyRevenue.data.dateInfo.formattedDate}
                        </Typography>
                      </CardContent>
                    </Card>
                    {!isStaff && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Tổng doanh thu
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Typography variant="h4" className="text-green-600">
                            {formatCurrency(totalRevenue)} VNĐ
                          </Typography>
                        </CardContent>
                      </Card>
                    )}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Số lượng hóa đơn
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Typography variant="h4">{billCount}</Typography>
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
                              <TableHead>PT thanh toán</TableHead>
                              <TableHead>Người hoàn tất</TableHead>
                              <TableHead>Người tạo</TableHead>
                              {!isStaff && (
                                <TableHead className="text-right">
                                  Số tiền
                                </TableHead>
                              )}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredBills.map((bill) => (
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
                                  {roomsData?.[bill.roomId] ||
                                    bill.roomId ||
                                    "N/A"}
                                </TableCell>
                                <TableCell>
                                  {formatPaymentMethod(
                                    bill.paymentMethod || "N/A"
                                  )}
                                </TableCell>
                                <TableCell>{bill.completedBy || "N/A"}</TableCell>
                                <TableCell>{bill.createdBy || "N/A"}</TableCell>
                                {!isStaff && (
                                  <TableCell className="text-right">
                                    {formatCurrency(bill.totalAmount)} VNĐ
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()
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
            (() => {
              const { filteredBills, totalRevenue, billCount } =
                calculateFilteredStats(weeklyRevenue.data.bills);
              return (
                <div className="space-y-6">
                  <div
                    className={`grid grid-cols-1 gap-4 ${
                      isStaff ? "md:grid-cols-3" : "md:grid-cols-4"
                    }`}
                  >
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
                    {!isStaff && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Tổng doanh thu
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Typography variant="h4" className="text-green-600">
                            {formatCurrency(totalRevenue)} VNĐ
                          </Typography>
                        </CardContent>
                      </Card>
                    )}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Số lượng hóa đơn
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Typography variant="h4">{billCount}</Typography>
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
                              <TableHead>PT thanh toán</TableHead>
                              <TableHead>Người hoàn tất</TableHead>
                              <TableHead>Người tạo</TableHead>
                              {!isStaff && (
                                <TableHead className="text-right">
                                  Số tiền
                                </TableHead>
                              )}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredBills.map((bill) => (
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
                                  {roomsData?.[bill.roomId] ||
                                    bill.roomId ||
                                    "N/A"}
                                </TableCell>
                                <TableCell>
                                  {formatPaymentMethod(
                                    bill.paymentMethod || "N/A"
                                  )}
                                </TableCell>
                                <TableCell>{bill.completedBy || "N/A"}</TableCell>
                                <TableCell>{bill.createdBy || "N/A"}</TableCell>
                                {!isStaff && (
                                  <TableCell className="text-right">
                                    {formatCurrency(bill.totalAmount)} VNĐ
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()
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
            (() => {
              const { filteredBills, totalRevenue, billCount } =
                calculateFilteredStats(monthlyRevenue.data.bills);
              return (
                <div className="space-y-6">
                  <div
                    className={`grid grid-cols-1 gap-4 ${
                      isStaff ? "md:grid-cols-3" : "md:grid-cols-4"
                    }`}
                  >
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
                    {!isStaff && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Tổng doanh thu
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Typography variant="h4" className="text-green-600">
                            {formatCurrency(totalRevenue)} VNĐ
                          </Typography>
                        </CardContent>
                      </Card>
                    )}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Số lượng hóa đơn
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Typography variant="h4">{billCount}</Typography>
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
                              <TableHead>PT thanh toán</TableHead>
                              <TableHead>Người hoàn tất</TableHead>
                              <TableHead>Người tạo</TableHead>
                              {!isStaff && (
                                <TableHead className="text-right">
                                  Số tiền
                                </TableHead>
                              )}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredBills.map((bill) => (
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
                                  {roomsData?.[bill.roomId] ||
                                    bill.roomId ||
                                    "N/A"}
                                </TableCell>
                                <TableCell>
                                  {formatPaymentMethod(
                                    bill.paymentMethod || "N/A"
                                  )}
                                </TableCell>
                                <TableCell>{bill.completedBy || "N/A"}</TableCell>
                                <TableCell>{bill.createdBy || "N/A"}</TableCell>
                                {!isStaff && (
                                  <TableCell className="text-right">
                                    {formatCurrency(bill.totalAmount)} VNĐ
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()
          ) : (
            <div className="text-center p-8">
              Chọn ngày trong tháng và nhấn "Cập nhật dữ liệu" để xem thống kê
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal chi tiết hóa đơn */}
      <Dialog open={billDetailOpen} onOpenChange={setBillDetailOpen}>
        <DialogContent className="sm:max-w-3xl">
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

                {billDetail.data.result.freeHourPromotion ? (
                  <div className="border border-purple-200 rounded-lg bg-white/70 p-3 space-y-1">
                    <p className="font-bold text-purple-700">
                      Ưu đãi giờ miễn phí
                    </p>
                    <div className="flex justify-between text-sm">
                      <span>Phút miễn phí áp dụng</span>
                      <span className="font-semibold text-green-700">
                        {billDetail.data.result.freeHourPromotion
                          .freeMinutesApplied || 0}{" "}
                        phút
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Giá trị miễn phí</span>
                      <span className="font-semibold text-green-700">
                        {formatCurrency(
                          billDetail.data.result.freeHourPromotion.freeAmount ||
                            0
                        )}{" "}
                        VNĐ
                      </span>
                    </div>
                  </div>
                ) : null}

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
