import staffScheduleApis, {
  ISpecialSalaryDay,
} from "@/apis/staffSchedule.apis";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, CalendarRange } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  HOURS_IN_DAY,
  formatHourLabel,
  formatVndInput,
  parseVndInput,
} from "../utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const specialDayFormSchema = z.object({
  businessDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Định dạng YYYY-MM-DD"),
  hourlyAmountMap: z.record(z.coerce.number().min(0)),
});

type SpecialDayFormValues = z.infer<typeof specialDayFormSchema>;

const buildEmptyHourMap = () => {
  const map: Record<string, number> = {};
  for (let h = 0; h < HOURS_IN_DAY; h += 1) {
    map[String(h)] = 0;
  }
  return map;
};

const filterHourMap = (map: Record<string, number>) => {
  const out: Record<string, number> = {};
  Object.entries(map).forEach(([k, v]) => {
    if (typeof v === "number" && v > 0) {
      out[k] = v;
    }
  });
  return out;
};

const salarySpecialDaysQueryKey = ["employeeSalarySpecialDays"] as const;

interface SpecialSalaryDaysSectionProps {
  from?: string;
  to?: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}

function SpecialSalaryDaysSection({
  from,
  to,
  onFromChange,
  onToChange,
}: SpecialSalaryDaysSectionProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rowPendingDelete, setRowPendingDelete] =
    useState<ISpecialSalaryDay | null>(null);

  const form = useForm<SpecialDayFormValues>({
    resolver: zodResolver(specialDayFormSchema),
    defaultValues: {
      businessDate: "",
      hourlyAmountMap: buildEmptyHourMap(),
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: [...salarySpecialDaysQueryKey, from || "", to || ""],
    queryFn: async () => {
      const res = await staffScheduleApis.getSpecialSalaryDays({
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      });
      return (res.data.result || []) as ISpecialSalaryDay[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: staffScheduleApis.upsertSpecialSalaryDay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salarySpecialDaysQueryKey });
      toast({
        title: "Thành công",
        description: "Đã lưu cấu hình ngày lương đặc biệt.",
      });
      form.reset({
        businessDate: "",
        hourlyAmountMap: buildEmptyHourMap(),
      });
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Không lưu được.";
      toast({ title: "Lỗi", description: msg, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: staffScheduleApis.deleteSpecialSalaryDay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salarySpecialDaysQueryKey });
      toast({
        title: "Thành công",
        description: "Đã xóa ngày lương đặc biệt.",
      });
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Không xóa được.";
      toast({ title: "Lỗi", description: msg, variant: "destructive" });
    },
  });

  const onSubmit = (values: SpecialDayFormValues) => {
    const hourlyAmountMap = filterHourMap(values.hourlyAmountMap);
    if (Object.keys(hourlyAmountMap).length === 0) {
      toast({
        title: "Thiếu dữ liệu",
        description:
          "Nhập ít nhất một khung giờ có mức lương ≥ 0 (đủ điều kiện > 0).",
        variant: "destructive",
      });
      return;
    }
    upsertMutation.mutate({
      businessDate: values.businessDate,
      hourlyAmountMap,
    });
  };

  const loadDayIntoForm = (row: ISpecialSalaryDay) => {
    const base = buildEmptyHourMap();
    Object.entries(row.hourlyAmountMap || {}).forEach(([k, v]) => {
      if (base[k] !== undefined && typeof v === "number") {
        base[k] = v;
      }
    });
    form.reset({
      businessDate: row.businessDate,
      hourlyAmountMap: base,
    });
  };

  const handleDeleteClick = (row: ISpecialSalaryDay) => {
    setRowPendingDelete(row);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!rowPendingDelete) return;
    deleteMutation.mutate(rowPendingDelete.businessDate, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setRowPendingDelete(null);
      },
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5" />
            Ngày lương đặc biệt
          </CardTitle>
          <CardDescription>
            Ghi đè toàn bộ map giờ cho từng ngày kinh doanh (YYYY-MM-DD). Dùng
            thay cho override theo nhân viên.
          </CardDescription>
          <div className="flex flex-wrap items-end gap-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs">Từ ngày</Label>
              <Input
                type="date"
                value={from || ""}
                onChange={(e) => onFromChange(e.target.value)}
                className="w-[180px]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Đến ngày</Label>
              <Input
                type="date"
                value={to || ""}
                onChange={(e) => onToChange(e.target.value)}
                className="w-[180px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Cập nhật</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : !data?.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Chưa có ngày đặc biệt trong khoảng lọc.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row) => (
                    <TableRow key={row._id}>
                      <TableCell className="font-medium">
                        {row.businessDate}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.updatedByName || row.updatedBy || "—"}
                        {row.updatedAt
                          ? ` · ${new Date(row.updatedAt).toLocaleString("vi-VN")}`
                          : ""}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => loadDayIntoForm(row)}
                        >
                          Sửa trên form
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          disabled={deleteMutation.isPending}
                          onClick={() => handleDeleteClick(row)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 border-t pt-4"
            >
              <div className="grid gap-2 md:grid-cols-[200px_1fr] md:items-end">
                <FormField
                  control={form.control}
                  name="businessDate"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Ngày lễ</Label>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-2 rounded-md border p-3 text-sm md:grid-cols-[120px_1fr]">
                <span className="font-medium">Khung giờ</span>
                <span className="font-medium">Số tiền / giờ (VND)</span>
              </div>

              <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                {Array.from({ length: HOURS_IN_DAY }, (_, hour) => {
                  const hourKey = String(hour);
                  return (
                    <div
                      key={hourKey}
                      className="grid gap-2 rounded-md border p-3 md:grid-cols-[120px_1fr]"
                    >
                      <div className="flex items-center text-sm font-medium text-muted-foreground">
                        {formatHourLabel(hour)}
                      </div>
                      <FormField
                        control={form.control}
                        name={`hourlyAmountMap.${hourKey}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="text"
                                inputMode="numeric"
                                placeholder="0"
                                disabled={upsertMutation.isPending}
                                value={formatVndInput(field.value)}
                                onChange={(event) =>
                                  field.onChange(
                                    parseVndInput(event.target.value),
                                  )
                                }
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  );
                })}
              </div>

              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? "Đang lưu..." : "Lưu ngày đặc biệt"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setRowPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa ngày lương đặc biệt</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa toàn bộ cấu hình map giờ cho ngày{" "}
              <span className="font-semibold text-foreground">
                {rowPendingDelete?.businessDate}
              </span>
              ? Thao tác không hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Hủy
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={handleDeleteConfirm}
            >
              {deleteMutation.isPending ? "Đang xóa..." : "Xóa"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default SpecialSalaryDaysSection;
export { salarySpecialDaysQueryKey };
