import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import billApis from "@/apis/bill.apis";
import { useQuery } from "@tanstack/react-query";
import { Gift, Loader2, Search } from "lucide-react";
import { useState } from "react";

const currency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);

const dateTime = (value: string) =>
  value ? new Date(value).toLocaleString("vi-VN") : "—";

export default function GiftAppliedBillsPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [kind, setKind] = useState<"all" | "fnb" | "discount">("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["gift-applied-bills", page, startDate, endDate, kind, search],
    queryFn: () => billApis.getGiftAppliedBills({ page, limit: 20, startDate, endDate, kind, search }),
  });

  const result = data?.data?.result;
  const summary = result?.summary;
  const items = result?.items || [];
  const totalPages = result?.pagination.totalPages || 1;

  const applyFilters = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-pink-100 p-2"><Gift className="h-5 w-5 text-pink-600" /></div>
        <div>
          <h1 className="text-2xl font-bold">Bill áp dụng quà membership</h1>
          <p className="text-sm text-muted-foreground">Theo dõi bill được tặng F&B hoặc áp dụng giảm giá.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Tổng bill</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{summary?.totalBills || 0}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Bill tặng F&B</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-emerald-600">{summary?.fnbBills || 0}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Bill giảm giá</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-blue-600">{summary?.discountBills || 0}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Tổng tiền đã giảm</CardTitle></CardHeader><CardContent className="text-xl font-bold">{currency((summary?.totalGiftDiscountAmount || 0) + (summary?.totalMembershipDiscountAmount || 0))}</CardContent></Card>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <label className="text-sm">Từ ngày<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block h-10 rounded-md border px-3 text-sm" /></label>
          <label className="text-sm">Đến ngày<input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 block h-10 rounded-md border px-3 text-sm" /></label>
          <label className="text-sm">Loại<select value={kind} onChange={(e) => { setKind(e.target.value as typeof kind); setPage(1); }} className="mt-1 block h-10 rounded-md border bg-white px-3 text-sm"><option value="all">Tất cả</option><option value="fnb">F&B</option><option value="discount">Giảm giá</option></select></label>
          <div className="relative min-w-[240px] flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && applyFilters()} placeholder="Mã bill, tên hoặc SĐT member" className="pl-9" /></div>
          <Button onClick={applyFilters} disabled={isFetching}><Search className="mr-2 h-4 w-4" />Tìm kiếm</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin" /></div> : isError ? <div className="space-y-3 p-10 text-center text-sm text-red-600">Không thể tải thống kê.<br /><Button variant="outline" onClick={() => refetch()}>Thử lại</Button></div> : items.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">Không có bill nào áp dụng quà trong bộ lọc hiện tại.</div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-b bg-muted/40"><tr>{["Thời gian", "Mã bill", "Member", "Phòng", "Loại áp dụng", "Quà / ưu đãi", "Giảm", "Tổng bill"].map((heading) => <th key={heading} className="whitespace-nowrap px-4 py-3 text-left font-medium">{heading}</th>)}</tr></thead><tbody>{items.map((item) => <tr key={item._id} className="border-b last:border-0"><td className="whitespace-nowrap px-4 py-3">{dateTime(item.endTime)}</td><td className="px-4 py-3 font-medium">{item.invoiceCode}</td><td className="px-4 py-3">{item.customerName || "—"}<div className="text-xs text-muted-foreground">{item.customerPhone}</div></td><td className="px-4 py-3">{item.roomName}</td><td className="px-4 py-3">{item.appliedKind === "fnb" ? "F&B" : "Giảm giá"}<div className="text-xs text-muted-foreground">{item.appliedSource === "membership" ? "Membership" : "Gift"}</div></td><td className="px-4 py-3">{item.giftName}</td><td className="whitespace-nowrap px-4 py-3">{currency(item.giftDiscountAmount + item.membershipDiscountAmount)}</td><td className="whitespace-nowrap px-4 py-3">{currency(item.totalAmount)}</td></tr>)}</tbody></table></div>}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm"><span>Trang {page} / {totalPages} · {result?.pagination.total || 0} bill</span><div className="flex gap-2"><Button variant="outline" disabled={page <= 1 || isFetching} onClick={() => setPage((value) => value - 1)}>Trước</Button><Button variant="outline" disabled={page >= totalPages || isFetching} onClick={() => setPage((value) => value + 1)}>Sau</Button></div></div>
    </div>
  );
}
