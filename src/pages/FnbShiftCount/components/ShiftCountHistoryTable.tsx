import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Role } from "@/constants/enum";
import { useUsers } from "@/hooks/use-users";
import dayjs from "@/lib/dayjs";
import { cn } from "@/lib/utils";
import type { IFnbShiftCountResponse } from "@/apis/fnbShiftCount.apis";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const STAFF_ALL = "__all__";

interface ShiftCountHistoryTableProps {
  records: IFnbShiftCountResponse[];
  isLoading?: boolean;
  historyFrom: string;
  historyTo: string;
  historyStaffId: string;
  onHistoryFromChange: (value: string) => void;
  onHistoryToChange: (value: string) => void;
  onHistoryStaffIdChange: (value: string) => void;
  onViewRecord: (record: IFnbShiftCountResponse) => void;
}

const ShiftCountHistoryTable = ({
  records,
  isLoading,
  historyFrom,
  historyTo,
  historyStaffId,
  onHistoryFromChange,
  onHistoryToChange,
  onHistoryStaffIdChange,
  onViewRecord,
}: ShiftCountHistoryTableProps) => {
  const { users, isLoadingUsers } = useUsers({ role: Role.Staff, limit: 1000 });

  const renderDatePicker = (
    label: string,
    value: string,
    onChange: (value: string) => void,
  ) => {
    const selectedDate = value ? dayjs(value, "YYYY-MM-DD").toDate() : undefined;

    return (
      <div className="flex w-[200px] flex-col gap-2">
        <label className="text-sm font-medium">{label}</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-9 w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground",
              )}
            >
              <Calendar className="mr-2 h-4 w-4 shrink-0" />
              {selectedDate ? (
                format(selectedDate, "dd/MM/yyyy", { locale: vi })
              ) : (
                <span>Chọn ngày</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(nextDate) => {
                if (nextDate) {
                  onChange(dayjs(nextDate).format("YYYY-MM-DD"));
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        {renderDatePicker("Từ ngày", historyFrom, onHistoryFromChange)}
        {renderDatePicker("Đến ngày", historyTo, onHistoryToChange)}
        <div className="flex w-[220px] flex-col gap-2">
          <label className="text-sm font-medium">Nhân viên</label>
          <Select
            value={historyStaffId || STAFF_ALL}
            onValueChange={(value) =>
              onHistoryStaffIdChange(value === STAFF_ALL ? "" : value)
            }
            disabled={isLoadingUsers}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Tất cả nhân viên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={STAFF_ALL}>Tất cả nhân viên</SelectItem>
              {users.map((user) => (
                <SelectItem key={user._id} value={user._id}>
                  {user.name || user.full_name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-md border">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <div className="overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ngày</TableHead>
                <TableHead>Nhân viên</TableHead>
                <TableHead className="text-center">Món thiếu bill</TableHead>
                <TableHead>Cập nhật lúc</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Không có bản ghi kiểm kê trong khoảng thời gian này.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={`${record._id ?? record.businessDate}-${record.staffId}`}>
                    <TableCell className="font-medium">
                      {dayjs(record.businessDate).format("DD/MM/YYYY")}
                    </TableCell>
                    <TableCell>{record.staffName || record.staffId}</TableCell>
                    <TableCell
                      className={cn(
                        "text-center font-semibold",
                        record.summary.shortageCount > 0 && "text-destructive",
                      )}
                    >
                      {record.summary.shortageCount}
                    </TableCell>
                    <TableCell>
                      {record.updatedAt
                        ? dayjs(record.updatedAt).format("DD/MM/YYYY HH:mm")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onViewRecord(record)}
                      >
                        Xem chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ShiftCountHistoryTable;
