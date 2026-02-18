import { PageHeader } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import fnbOrderApis, {
  type FnbStatsCategory,
  type FnbStatsPeriod,
  type IFnbOrderStatsParams,
} from "@/apis/fnbOrder.apis";
import { useDebounce } from "@/hooks/use-debounce";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Calendar, Search, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { useMemo, useState } from "react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 400;

const PERIOD_OPTIONS: { value: FnbStatsPeriod; label: string }[] = [
  { value: "day", label: "By day" },
  { value: "week", label: "By week" },
  { value: "month", label: "By month" },
];

const CATEGORY_FILTER_ALL = "__all__";

const CATEGORY_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: CATEGORY_FILTER_ALL, label: "All" },
  { value: "drink", label: "Drinks" },
  { value: "snack", label: "Snacks" },
];

const CATEGORY_LABELS: Record<string, string> = {
  drink: "Drink",
  drinks: "Drinks",
  snack: "Snack",
  snacks: "Snacks",
};

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category?.toLowerCase()] ?? category;
}

const FnbStatsPage = () => {
  const [period, setPeriod] = useState<FnbStatsPeriod>("day");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [category, setCategory] = useState<"" | FnbStatsCategory>("");
  const [search, setSearch] = useState("");
  const searchDebounced = useDebounce(search, DEBOUNCE_MS);

  const params: IFnbOrderStatsParams = useMemo(
    () => ({
      period,
      date: date ? format(date, "yyyy-MM-dd") : undefined,
      ...(category ? { category } : {}),
      ...(searchDebounced.trim() ? { search: searchDebounced.trim() } : {}),
    }),
    [period, date, category, searchDebounced]
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["fnbOrderStats", params.period, params.date, params.category, params.search],
    queryFn: () => fnbOrderApis.getFnbOrderStats(params),
    enabled: true,
  });

  const result = data?.data?.result;
  const periodLabel =
    period === "day"
      ? "Day"
      : period === "week"
        ? "Week"
        : "Month";

  return (
    <div className="space-y-6">
      <PageHeader
        title="FNB Statistics"
        description="Food & beverage order stats by day, week, or month"
        icon={BarChart3}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Period</label>
            <Select
              value={period}
              onValueChange={(v) => setPeriod(v as FnbStatsPeriod)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {period === "day"
                ? "Date"
                : period === "week"
                  ? "Date in week"
                  : "Date in month"}
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {date ? (
                    format(date, "MMM d, yyyy", { locale: enUS })
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  locale={enUS}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select
              value={category || CATEGORY_FILTER_ALL}
              onValueChange={(v) =>
                setCategory(v === CATEGORY_FILTER_ALL ? "" : (v as FnbStatsCategory))
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Search by item name</label>
            <div className="relative w-[240px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {isError && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-destructive">
              {error instanceof Error ? error.message : "Failed to load FNB statistics."}
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && result && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Time range ({periodLabel})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {result.period.fromFormatted} — {result.period.toFormatted}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total items sold
                </CardTitle>
                <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {result.totalItemsSold}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Orders
                </CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.ordersCount}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Items breakdown</CardTitle>
              <p className="text-sm text-muted-foreground">
                Quantity sold per item in the selected period
              </p>
            </CardHeader>
            <CardContent>
              {result.itemsBreakdown.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center">
                  No sales data for this period.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.itemsBreakdown.map((item) => (
                      <TableRow key={item.itemId}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          {getCategoryLabel(item.category)}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default FnbStatsPage;
