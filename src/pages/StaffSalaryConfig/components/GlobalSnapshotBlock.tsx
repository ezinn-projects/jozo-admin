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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { UseFormReturn, useForm } from "react-hook-form";
import { z } from "zod";
import { SalaryFormValues } from "../types";
import { formatVndInput, parseVndInput } from "../utils";

const salaryFormSchema = z.object({
  hourlyRate: z.coerce
    .number()
    .min(0, "Lương theo giờ phải lớn hơn hoặc bằng 0"),
});

interface GlobalSnapshotBlockProps {
  form: UseFormReturn<SalaryFormValues>;
  isBusy: boolean;
  isSaving: boolean;
  isSyncing: boolean;
  onSubmit: (values: SalaryFormValues) => void;
  onSync: () => void;
}

export const useSalaryForm = (defaultValues: SalaryFormValues) =>
  useForm<SalaryFormValues>({
    resolver: zodResolver(salaryFormSchema),
    defaultValues,
  });

function GlobalSnapshotBlock({
  form,
  isBusy,
  isSaving,
  isSyncing,
  onSubmit,
  onSync,
}: GlobalSnapshotBlockProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Snapshot</CardTitle>
        <CardDescription>
          Cấu hình mức lương mặc định được snapshot khi tạo ca làm việc.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 md:grid-cols-[1fr_auto_auto]"
          >
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
                      disabled={isBusy}
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

            <div className="flex items-end">
              <Button type="submit" disabled={isBusy}>
                {isSaving ? "Đang lưu..." : "Lưu snapshot"}
              </Button>
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                disabled={isBusy}
                onClick={onSync}
              >
                {isSyncing ? "Đang đồng bộ..." : "Đồng bộ tất cả nhân viên"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default GlobalSnapshotBlock;
