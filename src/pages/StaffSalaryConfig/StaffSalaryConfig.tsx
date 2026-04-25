import {
  IEmployeeSalaryConfig,
  IEmployeeSalarySnapshot,
} from "@/apis/staffSchedule.apis";
import staffScheduleApis from "@/apis/staffSchedule.apis";
import { PageHeader } from "@/components/shared";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleDollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import EmployeeSalaryOverrideDialog from "./components/EmployeeSalaryOverrideDialog";
import EmployeeSalaryTable from "./components/EmployeeSalaryTable";
import GlobalSnapshotBlock, {
  useSalaryForm,
} from "./components/GlobalSnapshotBlock";
import { useQueryConfig } from "./hooks/useQueryConfig";
import { OverrideDialogState, SalaryFormValues } from "./types";

const salaryQueryKeys = {
  snapshot: ["employeeSalarySnapshot"] as const,
  employees: ["employeeSalaryEmployees"] as const,
};

const defaultSalaryValues: SalaryFormValues = {
  hourlyRate: 0,
};

const normalizeSalarySnapshot = (
  data?: IEmployeeSalarySnapshot | null
): SalaryFormValues => ({
  hourlyRate: data?.hourlyRate ?? 0,
});

const extractEmployeeList = (result: unknown): IEmployeeSalaryConfig[] => {
  if (Array.isArray(result)) {
    return result as IEmployeeSalaryConfig[];
  }

  if (
    result &&
    typeof result === "object" &&
    "items" in result &&
    Array.isArray((result as { items?: unknown }).items)
  ) {
    return (result as { items: IEmployeeSalaryConfig[] }).items;
  }

  return [];
};

function StaffSalaryConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { queryConfig, setQueryConfig } = useQueryConfig();
  const form = useSalaryForm(defaultSalaryValues);
  const [overrideDialog, setOverrideDialog] = useState<OverrideDialogState>({
    isOpen: false,
    employee: null,
  });

  const {
    data: snapshotResponse,
    isLoading: isLoadingSnapshot,
    isFetching: isFetchingSnapshot,
  } = useQuery({
    queryKey: salaryQueryKeys.snapshot,
    queryFn: staffScheduleApis.getSalarySnapshot,
  });

  const { data: employeesResponse, isLoading: isLoadingEmployees } = useQuery({
    queryKey: salaryQueryKeys.employees,
    queryFn: staffScheduleApis.getSalaryEmployees,
  });

  const snapshot = snapshotResponse?.data.result;
  const employees = extractEmployeeList(employeesResponse?.data.result);
  const keyword = queryConfig.keyword.trim().toLowerCase();
  const filteredEmployees = employees.filter((employee) => {
    const userName = employee.userName?.toLowerCase() || "";
    const userPhone = employee.userPhone || "";

    return userName.includes(keyword) || userPhone.includes(keyword);
  });

  useEffect(() => {
    form.reset(normalizeSalarySnapshot(snapshot));
  }, [form, snapshot]);

  const invalidateSalaryQueries = () => {
    queryClient.invalidateQueries({ queryKey: salaryQueryKeys.snapshot });
    queryClient.invalidateQueries({ queryKey: salaryQueryKeys.employees });
  };

  const updateSnapshotMutation = useMutation({
    mutationFn: staffScheduleApis.updateSalarySnapshot,
    onSuccess: () => {
      invalidateSalaryQueries();
      toast({
        title: "Thành công",
        description: "Đã lưu salary snapshot global.",
      });
    },
  });

  const syncSalaryMutation = useMutation({
    mutationFn: staffScheduleApis.syncSalarySnapshot,
    onSuccess: () => {
      invalidateSalaryQueries();
      toast({
        title: "Thành công",
        description: "Đã đồng bộ salary snapshot cho tất cả nhân viên.",
      });
    },
  });

  const updateOverrideMutation = useMutation({
    mutationFn: ({
      userId,
      hourlyRate,
    }: {
      userId: string;
      hourlyRate: number;
    }) =>
      staffScheduleApis.updateEmployeeSalaryOverride(userId, {
        hourlyRate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salaryQueryKeys.employees });
      setOverrideDialog({ isOpen: false, employee: null });
      toast({
        title: "Thành công",
        description: "Đã lưu override lương nhân viên.",
      });
    },
  });

  const deleteOverrideMutation = useMutation({
    mutationFn: staffScheduleApis.deleteEmployeeSalaryOverride,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salaryQueryKeys.employees });
      toast({
        title: "Thành công",
        description: "Đã bỏ override và quay về snapshot global.",
      });
    },
  });

  const handleSaveSnapshot = (values: SalaryFormValues) => {
    updateSnapshotMutation.mutate({
      hourlyRate: values.hourlyRate,
    });
  };

  const handleOverrideSubmit = (values: SalaryFormValues) => {
    if (!overrideDialog.employee) return;

    updateOverrideMutation.mutate({
      userId: overrideDialog.employee.userId,
      hourlyRate: values.hourlyRate,
    });
  };

  const isGlobalBusy =
    isLoadingSnapshot ||
    isFetchingSnapshot ||
    updateSnapshotMutation.isPending ||
    syncSalaryMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cấu hình lương nhân viên"
        description="Quản lý salary snapshot global và override mức lương theo từng nhân viên."
        icon={CircleDollarSign}
        className="mb-2"
      />

      <GlobalSnapshotBlock
        form={form}
        isBusy={isGlobalBusy}
        isSaving={updateSnapshotMutation.isPending}
        isSyncing={syncSalaryMutation.isPending}
        onSubmit={handleSaveSnapshot}
        onSync={() => syncSalaryMutation.mutate()}
      />

      <EmployeeSalaryTable
        employees={filteredEmployees}
        keyword={queryConfig.keyword}
        isLoading={isLoadingEmployees}
        isResetting={deleteOverrideMutation.isPending}
        onKeywordChange={(value) => setQueryConfig({ keyword: value })}
        onOverride={(employee) =>
          setOverrideDialog({ isOpen: true, employee })
        }
        onResetOverride={(employee) =>
          deleteOverrideMutation.mutate(employee.userId)
        }
      />

      <EmployeeSalaryOverrideDialog
        employee={overrideDialog.employee}
        isOpen={overrideDialog.isOpen}
        isSaving={updateOverrideMutation.isPending}
        onClose={() => setOverrideDialog({ isOpen: false, employee: null })}
        onSubmit={handleOverrideSubmit}
      />
    </div>
  );
}

export default StaffSalaryConfig;
