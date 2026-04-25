import { IEmployeeSalaryConfig } from "@/apis/staffSchedule.apis";

export type SalaryFormValues = {
  hourlyRate: number;
};

export type OverrideDialogState = {
  isOpen: boolean;
  employee: IEmployeeSalaryConfig | null;
};
