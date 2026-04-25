import { IEmployeeSalaryConfig } from "@/apis/staffSchedule.apis";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";

interface EmployeeSalaryTableProps {
  employees: IEmployeeSalaryConfig[];
  keyword: string;
  isLoading: boolean;
  isResetting: boolean;
  onKeywordChange: (keyword: string) => void;
  onOverride: (employee: IEmployeeSalaryConfig) => void;
  onResetOverride: (employee: IEmployeeSalaryConfig) => void;
}

const formatCurrency = (value?: number) =>
  typeof value === "number" ? `${value.toLocaleString("vi-VN")} VNĐ` : "N/A";

function EmployeeSalaryTable({
  employees,
  keyword,
  isLoading,
  isResetting,
  onKeywordChange,
  onOverride,
  onResetOverride,
}: EmployeeSalaryTableProps) {
  return (
    <Card>
      <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle>Danh sách nhân viên</CardTitle>
          <CardDescription>
            Quản lý lương snapshot và override theo từng nhân viên.
          </CardDescription>
        </div>
        <div className="relative w-full md:w-[320px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
            placeholder="Tìm theo tên hoặc số điện thoại..."
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nhân viên</TableHead>
              <TableHead>Số điện thoại</TableHead>
              <TableHead>Hourly Rate</TableHead>
              <TableHead>Snapshot Hourly Rate</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center">
                  Đang tải danh sách nhân viên...
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  Không có nhân viên phù hợp
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow key={employee.userId}>
                  <TableCell className="font-medium">
                    {employee.userName || "N/A"}
                  </TableCell>
                  <TableCell>{employee.userPhone || "N/A"}</TableCell>
                  <TableCell>{formatCurrency(employee.hourlyRate)}</TableCell>
                  <TableCell>
                    {formatCurrency(employee.snapshotHourlyRate)}
                  </TableCell>
                  <TableCell>
                    {employee.isOverride ? (
                      <Badge>Override</Badge>
                    ) : (
                      <Badge variant="secondary">Theo snapshot</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onOverride(employee)}
                      >
                        Override
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={!employee.isOverride || isResetting}
                        onClick={() => onResetOverride(employee)}
                      >
                        Bỏ override
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default EmployeeSalaryTable;
