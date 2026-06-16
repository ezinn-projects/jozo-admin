import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { IFnbShiftCountSummary } from "@/apis/fnbShiftCount.apis";
import { formatVariance } from "../utils";

interface ShiftCountSummaryProps {
  summary?: IFnbShiftCountSummary;
  staffName?: string;
  businessDate?: string;
  editable?: boolean;
}

const ShiftCountSummary = ({
  summary,
  staffName,
  businessDate,
  editable,
}: ShiftCountSummaryProps) => {
  if (!summary) return null;

  const hasShortage = summary.shortageCount > 0;

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_auto]">
      <Card className={hasShortage ? "border-destructive/40 bg-destructive/5" : ""}>
        <CardContent className="flex flex-wrap items-center gap-6 p-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Ngày kiểm kê
            </p>
            <p className="text-lg font-semibold">{businessDate || "—"}</p>
          </div>
          {staffName && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Nhân viên
              </p>
              <p className="text-lg font-semibold">{staffName}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Món thiếu bill
            </p>
            <p
              className={`text-lg font-semibold ${
                hasShortage ? "text-destructive" : "text-foreground"
              }`}
            >
              {summary.shortageCount}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Trạng thái
            </p>
            <p className="text-sm font-medium">
              {editable ? "Có thể chỉnh sửa" : "Chỉ xem"}
            </p>
          </div>
        </CardContent>
      </Card>

      {hasShortage && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p className="text-sm font-semibold">Cảnh báo thiếu bill</p>
            </div>
            <ul className="max-h-28 space-y-1 overflow-y-auto text-sm">
              {summary.shortageItems.map((item) => (
                <li key={item.itemId} className="flex justify-between gap-4">
                  <span className="truncate">{item.itemName}</span>
                  <span className="shrink-0 font-semibold text-destructive">
                    {formatVariance(item.variance)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShiftCountSummary;
