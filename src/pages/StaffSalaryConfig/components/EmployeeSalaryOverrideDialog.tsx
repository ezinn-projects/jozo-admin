import { IEmployeeSalaryConfig } from "@/apis/staffSchedule.apis";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { SalaryFormValues } from "../types";
import { formatVndInput, parseVndInput } from "../utils";

const overrideFormSchema = z.object({
  hourlyRate: z.coerce
    .number()
    .min(0, "Lương theo giờ phải lớn hơn hoặc bằng 0"),
});

interface EmployeeSalaryOverrideDialogProps {
  employee: IEmployeeSalaryConfig | null;
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: SalaryFormValues) => void;
}

function EmployeeSalaryOverrideDialog({
  employee,
  isOpen,
  isSaving,
  onClose,
  onSubmit,
}: EmployeeSalaryOverrideDialogProps) {
  const form = useForm<SalaryFormValues>({
    resolver: zodResolver(overrideFormSchema),
    defaultValues: {
      hourlyRate: 0,
    },
  });

  useEffect(() => {
    form.reset({
      hourlyRate: employee?.hourlyRate ?? employee?.snapshotHourlyRate ?? 0,
    });
  }, [employee, form]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Override lương nhân viên</DialogTitle>
          <DialogDescription>
            Thiết lập mức lương riêng cho {employee?.userName || "nhân viên"}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="hourlyRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hourly Rate</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="20.000"
                      disabled={isSaving}
                      value={formatVndInput(field.value)}
                      onChange={(event) =>
                        field.onChange(parseVndInput(event.target.value))
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSaving || !employee}>
                {isSaving ? "Đang lưu..." : "Lưu override"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default EmployeeSalaryOverrideDialog;
