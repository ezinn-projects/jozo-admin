import staffScheduleApis, {
  IRegisterStaffScheduleRequest,
} from "@/apis/staffSchedule.apis";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, CircleXIcon, AlertTriangle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Portal } from "@radix-ui/react-portal";
import { ShiftType } from "@/constants/enum";
import dayjs from "dayjs";

const SHIFT_CONFIG: Record<
  ShiftType,
  { label: string; startTime: string; endTime: string }
> = {
  [ShiftType.Morning]: {
    label: "Shift 1",
    startTime: "09:00",
    endTime: "14:00",
  },
  [ShiftType.Afternoon]: {
    label: "Shift 2",
    startTime: "14:00",
    endTime: "19:00",
  },
  [ShiftType.All]: {
    label: "Shift 3",
    startTime: "19:00",
    endTime: "01:00",
  },
};

const SHIFT_OPTIONS = [
  ShiftType.Morning,
  ShiftType.Afternoon,
  ShiftType.All,
] as const;

const areTimesValid = (startTime?: string, endTime?: string) => {
  if (!startTime || !endTime) return true;

  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);
  const startTotal = startHours * 60 + startMinutes;
  let endTotal = endHours * 60 + endMinutes;

  if (endTotal <= startTotal) {
    endTotal += 24 * 60;
  }

  return endTotal > startTotal;
};

// Define schema using zod
const staffScheduleSchema = z
  .object({
    date: z.date({
      required_error: "Ngày là bắt buộc",
    }),
    shifts: z
      .array(z.enum([ShiftType.Morning, ShiftType.Afternoon, ShiftType.All]))
      .min(1, "Vui lòng chọn ít nhất một ca làm việc"),
    note: z.string().max(500).optional(),
    customStartTime: z.string().optional(),
    customEndTime: z.string().optional(),
  })
  .refine(
    (data) => {
      return areTimesValid(data.customStartTime, data.customEndTime);
    },
    {
      message: "Khoảng thời gian không hợp lệ",
      path: ["customEndTime"],
    },
  );

type FormValues = z.infer<typeof staffScheduleSchema>;

interface StaffScheduleRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  staffName?: string;
  refetchSchedules?: () => void;
  initialDate?: Date;
  initialShift?: ShiftType;
  allowPastDates?: boolean;
}

const StaffScheduleRegistrationModal: React.FC<
  StaffScheduleRegistrationModalProps
> = ({
  isOpen,
  onClose,
  userId,
  staffName,
  refetchSchedules,
  initialDate,
  initialShift,
  allowPastDates = false,
}) => {
  const [timeError, setTimeError] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(staffScheduleSchema),
    defaultValues: {
      date: initialDate || new Date(),
      shifts: initialShift ? [initialShift] : [],
      note: "",
      customStartTime: "",
      customEndTime: "",
    },
  });

  const { control, handleSubmit, reset, setError, watch, setValue } = form;

  const customStartTime = watch("customStartTime");
  const customEndTime = watch("customEndTime");
  const selectedShifts = watch("shifts");
  const selectedDate = watch("date");
  const isPastSelectedDate =
    allowPastDates &&
    !!selectedDate &&
    dayjs(selectedDate).isBefore(dayjs(), "day");

  // Update form when modal opens with initial values
  useEffect(() => {
    if (isOpen) {
      if (initialDate) {
        setValue("date", initialDate);
      }
      setValue("shifts", initialShift ? [initialShift] : []);
    }
  }, [isOpen, initialDate, initialShift, setValue]);

  // Auto-fill time when exactly one shift is selected
  useEffect(() => {
    if (selectedShifts.length === 1) {
      const selectedShift = SHIFT_CONFIG[selectedShifts[0]];
      setValue("customStartTime", selectedShift.startTime);
      setValue("customEndTime", selectedShift.endTime);
    } else {
      setValue("customStartTime", "");
      setValue("customEndTime", "");
    }
  }, [selectedShifts, setValue]);

  // Validate time when values change
  useEffect(() => {
    if (customStartTime && customEndTime) {
      if (!areTimesValid(customStartTime, customEndTime)) {
        setTimeError("Khoảng thời gian không hợp lệ");
      } else {
        setTimeError("");
      }
    } else {
      setTimeError("");
    }
  }, [customStartTime, customEndTime]);

  const { mutate: registerSchedule, isPending: isSubmitting } = useMutation({
    mutationFn: (data: IRegisterStaffScheduleRequest) =>
      staffScheduleApis.registerStaffSchedule(data),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đăng ký lịch làm thành công",
      });
      reset();
      refetchSchedules?.();
      onClose();
    },
    onError: (error: unknown) => {
      // Kiểm tra xem có errors object trong response không
      const axiosError = error as {
        response?: {
          data?: {
            message?: string;
            errors?: Record<
              string,
              {
                type?: string;
                value?: unknown;
                msg?: string;
                path?: string;
                location?: string;
              }
            >;
          };
        };
        message?: string;
      };

      const responseData = axiosError?.response?.data;
      const errors = responseData?.errors;

      if (errors && typeof errors === "object") {
        // Extract tất cả msg từ errors object
        const errorMessages: string[] = [];
        const fieldErrors: Record<string, string> = {};

        Object.entries(errors).forEach(([field, errorData]) => {
          if (errorData?.msg) {
            errorMessages.push(errorData.msg);
            fieldErrors[field] = errorData.msg;
          }
        });

        // Hiển thị tất cả msg trong toast
        if (errorMessages.length > 0) {
          toast({
            title: responseData?.message || "Lỗi validation",
            description: errorMessages.join(", "),
            variant: "destructive",
          });
        }

        // Set lỗi vào form fields tương ứng
        Object.entries(fieldErrors).forEach(([field, message]) => {
          if (
            field === "shifts" ||
            field === "date" ||
            field === "note" ||
            field === "customStartTime" ||
            field === "customEndTime"
          ) {
            setError(
              field as
                | "shifts"
                | "date"
                | "note"
                | "customStartTime"
                | "customEndTime",
              {
                type: "server",
                message: message,
              },
            );
          }
        });
      } else {
        // Fallback: hiển thị message thông thường
        const errorMessage =
          responseData?.message ||
          axiosError?.message ||
          "Có lỗi xảy ra khi đăng ký lịch làm";
        toast({
          title: "Lỗi",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (values: FormValues) => {
    // Validate time before submit
    if (!areTimesValid(values.customStartTime, values.customEndTime)) {
      setTimeError("Khoảng thời gian không hợp lệ");
      return;
    }

    const dateStr = format(values.date, "yyyy-MM-dd");
    const payload: IRegisterStaffScheduleRequest = {
      userId,
      date: dateStr,
      shifts: values.shifts,
      note: values.note || undefined,
      customStartTime: values.customStartTime || undefined,
      customEndTime: values.customEndTime || undefined,
    };
    registerSchedule(payload);
  };

  const handleClose = () => {
    reset({
      date: new Date(),
      shifts: [],
      note: "",
      customStartTime: "",
      customEndTime: "",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Đăng ký lịch làm {staffName ? `cho ${staffName}` : ""}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {isPastSelectedDate && (
              <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Bạn đang tạo ca làm trong quá khứ. Hãy kiểm tra kỹ ngày và ca
                  trước khi đăng ký.
                </p>
              </div>
            )}

            <FormField
              control={control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Ngày làm việc</FormLabel>
                  <Popover modal={true}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Chọn ngày</span>
                          )}
                          {field.value ? (
                            <CircleXIcon
                              className="ml-auto h-4 w-4 opacity-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                field.onChange(undefined);
                              }}
                            />
                          ) : (
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <Portal>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            if (allowPastDates) return false;
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return date < today;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Portal>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="shifts"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base">Ca làm việc</FormLabel>
                  <div className="flex flex-col space-y-2">
                    {SHIFT_OPTIONS.map((shiftOption) => {
                      const config = SHIFT_CONFIG[shiftOption];
                      const checked = field.value?.includes(shiftOption);
                      return (
                        <FormItem
                          key={shiftOption}
                          className="flex items-center space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(isChecked) => {
                                const nextValues = isChecked
                                  ? [...(field.value || []), shiftOption]
                                  : (field.value || []).filter(
                                      (value) => value !== shiftOption,
                                    );
                                field.onChange(nextValues);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            {config.label}: {config.startTime} - {config.endTime}
                          </FormLabel>
                        </FormItem>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú (tùy chọn)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nhập ghi chú..."
                      className="resize-none"
                      maxLength={500}
                      {...field}
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
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting || !!timeError}>
                {isSubmitting ? "Đang đăng ký..." : "Đăng ký"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default StaffScheduleRegistrationModal;
