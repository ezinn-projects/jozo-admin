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
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { UseFormReturn, useForm } from "react-hook-form";
import { z } from "zod";
import { SalaryFormValues } from "../types";
import {
  HOURS_IN_DAY,
  formatHourLabel,
  formatVndInput,
  parseVndInput,
} from "../utils";

const salaryFormSchema = z.object({
  hourlyRateMap: z.record(
    z.coerce.number().min(0, "Hourly rate must be greater than or equal to 0"),
  ),
  hourlyShiftMap: z.record(z.enum(["shift1", "shift2", "shift3"]).nullable()),
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
          Hourly pay for each clock hour (00–23) and the matching work shift.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-2 rounded-md border p-3 text-sm md:grid-cols-[120px_1fr_180px]">
              <span className="font-medium">Hour</span>
              <span className="font-medium">Hourly rate (VND)</span>
              <span className="font-medium">Shift</span>
            </div>

            <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
              {Array.from({ length: HOURS_IN_DAY }, (_, hour) => {
                const hourKey = String(hour);

                return (
                  <div
                    key={hourKey}
                    className="grid gap-2 rounded-md border p-3 md:grid-cols-[120px_1fr_180px]"
                  >
                    <div className="flex items-center text-sm font-medium text-muted-foreground">
                      {formatHourLabel(hour)}
                    </div>

                    <FormField
                      control={form.control}
                      name={`hourlyRateMap.${hourKey}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="numeric"
                              placeholder="0"
                              disabled={isBusy}
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

                    <FormField
                      control={form.control}
                      name={`hourlyShiftMap.${hourKey}`}
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            disabled={isBusy}
                            value={field.value ?? "none"}
                            onValueChange={(value) =>
                              field.onChange(value === "none" ? null : value)
                            }
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="No shift" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="shift1">Shift 1</SelectItem>
                              <SelectItem value="shift2">Shift 2</SelectItem>
                              <SelectItem value="shift3">Shift 3</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                );
              })}
            </div>

            <FormDescription>
              On save, the system always sends all 24 keys from &quot;0&quot;
              through &quot;23&quot; for both rate and shift maps.
            </FormDescription>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" disabled={isBusy}>
                {isSaving ? "Saving..." : "Save snapshot"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isBusy}
                onClick={onSync}
              >
                {isSyncing ? "Syncing..." : "Sync all staff"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default GlobalSnapshotBlock;
