import { PageHeader } from "@/components/shared";
import { useState, useEffect, useMemo, type ReactNode } from "react";
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
import billAPis from "@/apis/bill.apis";
import dayjs from "@/lib/dayjs";
import type { Dayjs } from "dayjs";
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
  bank_transfer: "Chuyển khoản",
  Bank_Transfer: "Chuyển khoản",
  BANK_TRANSFER: "Chuyển khoản",
  "bank transfer": "Chuyển khoản",
  "Bank Transfer": "Chuyển khoản",
  "BANK TRANSFER": "Chuyển khoản",
  transfer: "Chuyển khoản",
  Transfer: "Chuyển khoản",
  TRANSFER: "Chuyển khoản",
  cash: "Tiền mặt",
  Cash: "Tiền mặt",
  CASH: "Tiền mặt",
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
  /** BE có thể trả (vd. mã kỳ); không có thì FE hiển thị theo dateRange */
  timeRange?: string;
  week?: number;
  year?: number;
  dateRange?: string;
  startDate?: Date;
  endDate?: Date;
  month?: string;
}

const VN_TZ = "Asia/Ho_Chi_Minh";

/** Chuẩn hóa ngày chọn trên lịch về nửa đêm theo giờ VN */
const calendarDateStartVn = (selectedDate: Date): Dayjs => {
  const ymd = dayjs(selectedDate).format("YYYY-MM-DD");
  return dayjs.tz(ymd, VN_TZ).startOf("day");
};

/** Tuần T2–CN (cùng logic nhiều màn lịch trong app); FE gửi start/end ISO cho GET /bill/revenue */
const startOfWeekMondayVn = (dayVn: Dayjs): Dayjs => {
  const d = dayVn.startOf("day");
  const dow = d.day();
  if (dow === 0) return d.subtract(6, "day");
  return d.subtract(dow - 1, "day");
};

/**
 * Kỳ doanh thu tháng (6 → 5): từ 00:00 ngày 6 tháng M đến cuối ngày 5 tháng M+1 (giờ VN).
 * Ví dụ kỳ chứa 15/05: 06/05 → 05/06.
 */
const revenueMonthPeriod6To5Containing = (
  dayVn: Dayjs,
): { periodStart: Dayjs; defaultEndDay: Dayjs } => {
  const d = dayVn.startOf("day");
  const periodStart =
    d.date() >= 6
      ? d.date(6).startOf("day")
      : d.subtract(1, "month").date(6).startOf("day");
  const defaultEndDay = periodStart.add(1, "month").date(5).startOf("day");
  return { periodStart, defaultEndDay };
};

/** Date giữa trưa local để Calendar không lệch ngày khi parse */
const localDateFromYmd = (ymd: string): Date => {
  const [y, m, day] = ymd.split("-").map(Number);
  return new Date(y, m - 1, day, 12, 0, 0, 0);
};

const localDateFromDayjsVnDay = (d: Dayjs): Date =>
  localDateFromYmd(d.format("YYYY-MM-DD"));

type BillRevenueApiResult = {
  timeRange?: string;
  dateRange: string;
  startDate: string;
  endDate: string;
  totalRevenue: number;
  billCount: number;
  bills: RevenueBill[];
};

const mapBillRevenueToState = (result: BillRevenueApiResult) => {
  const startVn = dayjs.utc(result.startDate).tz(VN_TZ);
  const endVn = dayjs.utc(result.endDate).tz(VN_TZ);
  return {
    totalRevenue: result.totalRevenue,
    billCount: result.billCount,
    bills: result.bills,
    dateInfo: {
      timeRange: result.timeRange,
      dateRange: result.dateRange,
      formattedDate: result.dateRange,
      startDate: startVn.toDate(),
      endDate: endVn.toDate(),
      month: startVn.format("MMMM"),
      year: startVn.year(),
    } satisfies DateInfo,
  };
};

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

const formatBillDate = (dateString: string) =>
  dayjs.utc(dateString).tz(VN_TZ).format("DD/MM/YYYY HH:mm");

const formatPaymentMethod = (method: string) =>
  paymentMethodMap[method] || method;

const StatCard = ({
  label,
  children,
  accent,
}: {
  label: string;
  children: ReactNode;
  accent?: boolean;
}) => (
  <Card>
    <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
      <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
        {label}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
      <p
        className={`text-base font-semibold sm:text-2xl ${
          accent ? "text-emerald-600" : ""
        }`}
      >
        {children}
      </p>
    </CardContent>
  </Card>
);

interface BillsTableSectionProps {
  bills: RevenueBill[];
  roomsData?: Record<string, string>;
  isStaff: boolean;
  onBillClick: (billId: string) => void;
}

/** Bảng hóa đơn: dạng bảng trên desktop, dạng thẻ trên mobile */
const BillsTableSection = ({
  bills,
  roomsData,
  isStaff,
  onBillClick,
}: BillsTableSectionProps) => (
  <Card>
    <CardHeader className="px-3 py-3 sm:px-6 sm:py-4">
      <CardTitle className="text-base sm:text-lg">Chi tiết hóa đơn</CardTitle>
    </CardHeader>
    <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
      {/* Desktop: bảng */}
      <div className="hidden rounded-md border sm:block">
        <div className="overflow-x-auto">
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
                  <TableHead className="text-right">Số tiền</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => (
                <TableRow key={bill._id || "unknown"}>
                  <TableCell className="font-medium">
                    <button
                      className="text-blue-600 hover:underline focus:outline-none"
                      onClick={() => bill._id && onBillClick(bill._id)}
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
                  <TableCell>
                    {formatPaymentMethod(bill.paymentMethod || "N/A")}
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
      </div>

      {/* Mobile: thẻ */}
      <div className="space-y-2 sm:hidden">
        {bills.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Không có hóa đơn
          </p>
        ) : (
          bills.map((bill) => (
            <div
              key={bill._id || "unknown"}
              className="rounded-md border p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  className="font-medium text-blue-600 hover:underline focus:outline-none"
                  onClick={() => bill._id && onBillClick(bill._id)}
                >
                  {bill.invoiceCode || "N/A"}
                </button>
                {!isStaff && (
                  <span className="font-semibold">
                    {formatCurrency(bill.totalAmount)} VNĐ
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <div className="flex flex-col">
                  <span className="text-[11px] text-muted-foreground">
                    Thời gian
                  </span>
                  <span>{formatBillDate(bill.createdAt.toString())}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-muted-foreground">
                    Phòng
                  </span>
                  <span>
                    {roomsData?.[bill.roomId] || bill.roomId || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-muted-foreground">
                    PT thanh toán
                  </span>
                  <span>
                    {formatPaymentMethod(bill.paymentMethod || "N/A")}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-muted-foreground">
                    Người hoàn tất
                  </span>
                  <span>{bill.completedBy || "N/A"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-muted-foreground">
                    Người tạo
                  </span>
                  <span>{bill.createdBy || "N/A"}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </CardContent>
  </Card>
);

const RevenueStatisticsPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  /** Chỉ dùng tab tuần / tháng: ngày kết thúc kỳ (mặc định CN cùng tuần hoặc ngày 5 tháng sau của kỳ 6→5) */
  const [selectedEndDate, setSelectedEndDate] = useState<Date>(() =>
    localDateFromYmd(dayjs().format("YYYY-MM-DD")),
  );
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

  const weekStartKey = useMemo(
    () =>
      startOfWeekMondayVn(calendarDateStartVn(selectedDate)).format(
        "YYYY-MM-DD",
      ),
    [selectedDate],
  );

  const monthPeriodStartKey = useMemo(
    () =>
      revenueMonthPeriod6To5Containing(
        calendarDateStartVn(selectedDate),
      ).periodStart.format("YYYY-MM-DD"),
    [selectedDate],
  );

  // Đồng bộ ngày kết thúc mặc định khi đổi tab hoặc khi đổi tuần / kỳ tháng (6→5), không reset khi chỉ đổi ngày trong cùng tuần hoặc cùng kỳ
  useEffect(() => {
    if (activeTab !== "weekly") return;
    const mon = dayjs.tz(weekStartKey, VN_TZ).startOf("day");
    setSelectedEndDate(localDateFromDayjsVnDay(mon.add(6, "day")));
  }, [activeTab, weekStartKey]);

  useEffect(() => {
    if (activeTab !== "monthly") return;
    const periodStart = dayjs.tz(monthPeriodStartKey, VN_TZ).startOf("day");
    const defaultEndDay = periodStart.add(1, "month").date(5).startOf("day");
    setSelectedEndDate(localDateFromDayjsVnDay(defaultEndDay));
  }, [activeTab, monthPeriodStartKey]);

  const weekStartVn = useMemo(
    () => dayjs.tz(weekStartKey, VN_TZ).startOf("day"),
    [weekStartKey],
  );

  const monthPeriod6To5 = useMemo(
    () => revenueMonthPeriod6To5Containing(calendarDateStartVn(selectedDate)),
    [selectedDate],
  );

  const { data: roomsData } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomApis.getRooms(),
    select: (data) =>
      data.data.result?.reduce(
        (acc, room) => {
          acc[room._id] = room.roomName;
          return acc;
        },
        {} as Record<string, string>,
      ),
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
    setDailyRevenue((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const d = calendarDateStartVn(selectedDate);
      const startIso = d.startOf("day").toISOString();
      const endIso = d.endOf("day").toISOString();
      const response = await billAPis.getBillRevenue(startIso, endIso);

      if (response?.data?.result) {
        setDailyRevenue({
          loading: false,
          error: null,
          data: mapBillRevenueToState(response.data.result),
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
    setWeeklyRevenue((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const mon = weekStartVn;
      const endDay = calendarDateStartVn(selectedEndDate);
      const startIso = mon.startOf("day").toISOString();
      const endCandidate = endDay.endOf("day");
      const endIso = (endCandidate.isBefore(mon, "day") ? mon : endDay)
        .endOf("day")
        .toISOString();
      const response = await billAPis.getBillRevenue(startIso, endIso);

      if (response?.data?.result) {
        setWeeklyRevenue({
          loading: false,
          error: null,
          data: mapBillRevenueToState(response.data.result),
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
    setMonthlyRevenue((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { periodStart } = monthPeriod6To5;
      const endDay = calendarDateStartVn(selectedEndDate);
      const startIso = periodStart.startOf("day").toISOString();
      const endIso = (
        endDay.isBefore(periodStart, "day") ? periodStart : endDay
      )
        .endOf("day")
        .toISOString();
      const response = await billAPis.getBillRevenue(startIso, endIso);

      if (response?.data?.result) {
        setMonthlyRevenue({
          loading: false,
          error: null,
          data: mapBillRevenueToState(response.data.result),
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

  const sortBillsByEndTimeDesc = (bills: RevenueBill[]) => {
    return [...bills].sort((a, b) => {
      const endTimeA = dayjs(a.endTime).valueOf();
      const endTimeB = dayjs(b.endTime).valueOf();

      return endTimeB - endTimeA;
    });
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
      filterBillsByPaymentMethod(bills),
    );
    const totalRevenue = filteredBills.reduce(
      (sum, bill) => sum + bill.totalAmount,
      0,
    );
    const billCount = filteredBills.length;
    return { filteredBills, totalRevenue, billCount };
  };

  return (
    <div className="p-3 space-y-5 sm:p-4 sm:space-y-6">
      <PageHeader
        title="Thống kê doanh thu"
        description="Theo ngày; theo tuần (T2–CN, chọn thêm ngày kết thúc); theo kỳ tháng 6→5 (ngày 6 tháng này đến ngày 5 tháng sau, có thể chỉnh ngày kết thúc)"
        icon={TrendingUp}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start sm:w-auto sm:min-w-[9rem]"
            >
              {activeTab === "daily" && (
                <>
                  Ngày: {calendarDateStartVn(selectedDate).format("DD/MM/YYYY")}
                </>
              )}
              {activeTab === "weekly" && (
                <>Tuần từ (T2): {weekStartVn.format("DD/MM/YYYY")}</>
              )}
              {activeTab === "monthly" && (
                <>
                  Kỳ từ (ngày 6):{" "}
                  {monthPeriod6To5.periodStart.format("DD/MM/YYYY")}
                </>
              )}
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

        {!isStaff && (activeTab === "weekly" || activeTab === "monthly") && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start sm:w-auto sm:min-w-[9rem]"
              >
                Đến: {calendarDateStartVn(selectedEndDate).format("DD/MM/YYYY")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedEndDate}
                onSelect={(date) => date && setSelectedEndDate(date)}
                initialFocus
                disabled={(date) => {
                  const cell = calendarDateStartVn(date);
                  if (activeTab === "weekly") {
                    return cell.isBefore(weekStartVn, "day");
                  }
                  return cell.isBefore(monthPeriod6To5.periodStart, "day");
                }}
              />
            </PopoverContent>
          </Popover>
        )}

        <Button
          className="w-full sm:w-auto"
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
        <div className="mb-5 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <TabsList
            className={
              isStaff ? "w-full sm:w-auto" : "grid w-full grid-cols-3 sm:w-auto"
            }
          >
            <TabsTrigger value="daily">Ngày</TabsTrigger>
            {!isStaff && (
              <>
                <TabsTrigger value="weekly">Tuần</TabsTrigger>
                <TabsTrigger value="monthly">Tháng</TabsTrigger>
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
              <SelectTrigger className="w-full sm:w-[200px]">
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
                <div className="space-y-4 sm:space-y-6">
                  <div
                    className={`grid grid-cols-2 gap-3 sm:gap-4 ${
                      isStaff ? "md:grid-cols-2" : "md:grid-cols-3"
                    }`}
                  >
                    <StatCard label="Ngày">
                      {dailyRevenue.data.dateInfo.formattedDate}
                    </StatCard>
                    {!isStaff && (
                      <StatCard label="Tổng doanh thu" accent>
                        {formatCurrency(totalRevenue)} VNĐ
                      </StatCard>
                    )}
                    <StatCard label="Số lượng hóa đơn">{billCount}</StatCard>
                  </div>

                  <BillsTableSection
                    bills={filteredBills}
                    roomsData={roomsData}
                    isStaff={isStaff}
                    onBillClick={handleBillClick}
                  />
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
                <div className="space-y-4 sm:space-y-6">
                  <div
                    className={`grid grid-cols-2 gap-3 sm:gap-4 ${
                      isStaff ? "md:grid-cols-3" : "md:grid-cols-4"
                    }`}
                  >
                    <StatCard label="Khoảng thời gian">
                      {weeklyRevenue.data.dateInfo.dateRange}
                    </StatCard>
                    {!isStaff && (
                      <StatCard label="Tổng doanh thu" accent>
                        {formatCurrency(totalRevenue)} VNĐ
                      </StatCard>
                    )}
                    <StatCard label="Số lượng hóa đơn">{billCount}</StatCard>
                  </div>

                  <BillsTableSection
                    bills={filteredBills}
                    roomsData={roomsData}
                    isStaff={isStaff}
                    onBillClick={handleBillClick}
                  />
                </div>
              );
            })()
          ) : (
            <div className="text-center p-8">
              Chọn ngày (xác định thứ Hai đầu tuần), chỉnh ngày kết thúc nếu
              cần, rồi nhấn nút Cập nhật dữ liệu để xem thống kê
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
                <div className="space-y-4 sm:space-y-6">
                  <div
                    className={`grid grid-cols-2 gap-3 sm:gap-4 ${
                      isStaff ? "md:grid-cols-3" : "md:grid-cols-4"
                    }`}
                  >
                    <StatCard label="Kỳ / nhãn">
                      {monthlyRevenue.data.dateInfo.timeRange ??
                        `${monthlyRevenue.data.dateInfo.month} ${monthlyRevenue.data.dateInfo.year}`}
                    </StatCard>
                    <StatCard label="Khoảng thời gian">
                      {monthlyRevenue.data.dateInfo.dateRange}
                    </StatCard>
                    {!isStaff && (
                      <StatCard label="Tổng doanh thu" accent>
                        {formatCurrency(totalRevenue)} VNĐ
                      </StatCard>
                    )}
                    <StatCard label="Số lượng hóa đơn">{billCount}</StatCard>
                  </div>

                  <BillsTableSection
                    bills={filteredBills}
                    roomsData={roomsData}
                    isStaff={isStaff}
                    onBillClick={handleBillClick}
                  />
                </div>
              );
            })()
          ) : (
            <div className="text-center p-8">
              Chọn một ngày để xác định kỳ (ngày 6 tháng này đến ngày 5 tháng
              sau), chỉnh ngày kết thúc nếu cần, rồi nhấn nút Cập nhật dữ liệu
              để xem thống kê
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal chi tiết hóa đơn */}
      <Dialog open={billDetailOpen} onOpenChange={setBillDetailOpen}>
        <DialogContent className="grid-cols-1 sm:max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <span>Chi tiết hóa đơn</span>
              {billDetail?.data?.result?.invoiceCode && (
                <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                  {billDetail.data.result.invoiceCode}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>Thông tin chi tiết về hóa đơn</DialogDescription>
          </DialogHeader>
          {isLoadingBillDetail ? (
            <div className="py-6 flex justify-center">
              <Spinner />
            </div>
          ) : billDetail && billDetail.data && billDetail.data.result ? (
            <div className="rounded-md border text-sm">
              {/* Thông tin chung */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-3 sm:grid-cols-4">
                <div className="flex min-w-0 flex-col">
                  <span className="text-[11px] text-muted-foreground">
                    Phòng
                  </span>
                  <span className="break-words font-medium">
                    {billDetail.data.result.roomName || "—"}
                  </span>
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="text-[11px] text-muted-foreground">
                    Loại phòng
                  </span>
                  <span className="break-words font-medium">
                    {billDetail.data.result.roomType || "—"}
                  </span>
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="text-[11px] text-muted-foreground">
                    Ngày tạo
                  </span>
                  <span className="break-words font-medium">
                    {billDetail.data.result.formattedCreatedAt || "—"}
                  </span>
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="text-[11px] text-muted-foreground">
                    Khách hàng
                  </span>
                  <span className="break-words font-medium">
                    {billDetail.data.result.customerName || "—"}
                  </span>
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="text-[11px] text-muted-foreground">
                    Bắt đầu
                  </span>
                  <span className="break-words font-medium">
                    {billDetail.data.result.formattedStartTime || "—"}
                  </span>
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="text-[11px] text-muted-foreground">
                    Kết thúc
                  </span>
                  <span className="break-words font-medium">
                    {billDetail.data.result.formattedEndTime || "—"}
                  </span>
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="text-[11px] text-muted-foreground">
                    Thời lượng
                  </span>
                  <span className="break-words font-medium">
                    {billDetail.data.result.usageDuration || "0"} giờ
                  </span>
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="text-[11px] text-muted-foreground">
                    Thanh toán
                  </span>
                  <span className="break-words font-medium">
                    {formatPaymentMethod(
                      billDetail.data.result.paymentMethod || "—",
                    )}
                  </span>
                </div>
              </div>

              <div className="border-t" />

              {/* Danh sách món */}
              <div className="p-3">
                <div className="flex items-center gap-2 border-b pb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  <span className="min-w-0 flex-1">Tên</span>
                  <span className="w-10 shrink-0 text-right">SL</span>
                  <span className="hidden w-20 shrink-0 text-right sm:block">
                    Đơn giá
                  </span>
                  <span className="w-24 shrink-0 text-right">Thành tiền</span>
                </div>
                {billDetail.data.result.items &&
                billDetail.data.result.items.length > 0 ? (
                  <div className="divide-y">
                    {billDetail.data.result.items.map(
                      (item: BillItem, index: number) => (
                        <div key={index} className="py-2">
                          <div className="flex items-center gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="truncate">{item.description}</p>
                              <p className="text-[11px] text-muted-foreground sm:hidden">
                                {formatCurrency(item.price)}/đv
                              </p>
                            </div>
                            <span className="w-10 shrink-0 text-right">
                              {item.quantity}
                            </span>
                            <span className="hidden w-20 shrink-0 text-right text-muted-foreground sm:block">
                              {formatCurrency(item.price)}
                            </span>
                            <span className="w-24 shrink-0 text-right font-medium">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                          {item.discountName && item.discountPercentage ? (
                            <div className="mt-0.5 flex items-center justify-between gap-2 text-[11px] text-emerald-600">
                              <span className="min-w-0 truncate">
                                - {item.discountName} ({item.discountPercentage}
                                %)
                              </span>
                              <span className="shrink-0">
                                -
                                {formatCurrency(
                                  ((item.originalPrice || item.price) *
                                    item.quantity *
                                    (item.discountPercentage || 0)) /
                                    100,
                                )}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="py-3 text-center text-xs text-muted-foreground">
                    Không có chi tiết đơn hàng
                  </p>
                )}
              </div>

              {/* Ưu đãi giờ miễn phí */}
              {billDetail.data.result.freeHourPromotion ? (
                <>
                  <div className="border-t" />
                  <div className="space-y-1 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Ưu đãi giờ miễn phí
                    </p>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Phút miễn phí áp dụng
                      </span>
                      <span className="font-medium">
                        {billDetail.data.result.freeHourPromotion
                          .freeMinutesApplied || 0}{" "}
                        phút
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Giá trị miễn phí
                      </span>
                      <span className="font-medium text-emerald-600">
                        -
                        {formatCurrency(
                          billDetail.data.result.freeHourPromotion.freeAmount ||
                            0,
                        )}
                      </span>
                    </div>
                  </div>
                </>
              ) : null}

              <div className="border-t" />

              {/* Tổng tiền */}
              <div className="flex items-center justify-between p-3 text-base font-semibold">
                <span>Tổng tiền</span>
                <span>
                  {formatCurrency(billDetail.data.result.totalAmount || 0)} VNĐ
                </span>
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
