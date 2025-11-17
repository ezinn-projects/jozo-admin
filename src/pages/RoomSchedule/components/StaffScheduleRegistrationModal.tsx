import staffScheduleApis, {
  IRegisterStaffScheduleRequest,
} from "@/apis/staffSchedule.apis";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, CircleXIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Portal } from "@radix-ui/react-portal";
import { ShiftType } from "@/constants/enum";

// Define schema using zod
const staffScheduleSchema = z
  .object({
    date: z.date({
      required_error: "Ngày là bắt buộc",
    }),
    shift: z.enum([ShiftType.Morning, ShiftType.Afternoon, ShiftType.All], {
      required_error: "Vui lòng chọn ca làm việc",
    }),
    note: z.string().max(500).optional(),
    customStartTime: z.string().optional(),
    customEndTime: z.string().optional(),
  })
  .refine(
    (data) => {
      // If both times are provided, validate start < end
      if (data.customStartTime && data.customEndTime) {
        const [startHours, startMinutes] = data.customStartTime
          .split(":")
          .map(Number);
        const [endHours, endMinutes] = data.customEndTime
          .split(":")
          .map(Number);
        const startTotal = startHours * 60 + startMinutes;
        const endTotal = endHours * 60 + endMinutes;
        return startTotal < endTotal;
      }
      return true;
    },
    {
      message: "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc",
      path: ["customEndTime"],
    }
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
}) => {
  const [timeError, setTimeError] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(staffScheduleSchema),
    defaultValues: {
      date: initialDate || new Date(),
      shift: initialShift || undefined,
      note: "",
      customStartTime: "",
      customEndTime: "",
    },
  });

  const { control, handleSubmit, reset, setError, watch, setValue } = form;

  const customStartTime = watch("customStartTime");
  const customEndTime = watch("customEndTime");
  const shift = watch("shift");

  // Update form when modal opens with initial values
  useEffect(() => {
    if (isOpen) {
      if (initialDate) {
        setValue("date", initialDate);
      }
      if (initialShift) {
        setValue("shift", initialShift);
      }
    }
  }, [isOpen, initialDate, initialShift, setValue]);

  // Auto-fill time based on selected shift
  useEffect(() => {
    if (shift) {
      if (shift === ShiftType.Morning) {
        // Ca sáng: 12:00 - 17:00
        setValue("customStartTime", "12:00");
        setValue("customEndTime", "17:00");
      } else if (shift === ShiftType.Afternoon) {
        // Ca chiều: 17:00 - 22:00
        setValue("customStartTime", "17:00");
        setValue("customEndTime", "22:00");
      } else if (shift === ShiftType.All) {
        // Cả ngày: 12:00 - 22:00
        setValue("customStartTime", "12:00");
        setValue("customEndTime", "22:00");
      }
    } else {
      // Nếu không có ca nào được chọn, clear thời gian
      setValue("customStartTime", "");
      setValue("customEndTime", "");
    }
  }, [shift, setValue]);

  // Validate time when values change
  useEffect(() => {
    if (customStartTime && customEndTime) {
      const [startHours, startMinutes] = customStartTime.split(":").map(Number);
      const [endHours, endMinutes] = customEndTime.split(":").map(Number);
      const startTotal = startHours * 60 + startMinutes;
      const endTotal = endHours * 60 + endMinutes;

      if (startTotal >= endTotal) {
        setTimeError("Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc");
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
            field === "shift" ||
            field === "date" ||
            field === "note" ||
            field === "customStartTime" ||
            field === "customEndTime"
          ) {
            setError(
              field as
                | "shift"
                | "date"
                | "note"
                | "customStartTime"
                | "customEndTime",
              {
                type: "server",
                message: message,
              }
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
    if (values.customStartTime && values.customEndTime) {
      const [startHours, startMinutes] = values.customStartTime
        .split(":")
        .map(Number);
      const [endHours, endMinutes] = values.customEndTime
        .split(":")
        .map(Number);
      const startTotal = startHours * 60 + startMinutes;
      const endTotal = endHours * 60 + endMinutes;

      if (startTotal >= endTotal) {
        setTimeError("Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc");
        return;
      }
    }

    const dateStr = format(values.date, "yyyy-MM-dd");
    const payload: IRegisterStaffScheduleRequest = {
      userId,
      date: dateStr,
      shifts: [values.shift], // Send as array with single shift value
      note: values.note || undefined,
      customStartTime: values.customStartTime || undefined,
      customEndTime: values.customEndTime || undefined,
    };
    registerSchedule(payload);
  };

  const handleClose = () => {
    reset({
      date: new Date(),
      shift: undefined,
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
                            !field.value && "text-muted-foreground"
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
              name="shift"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base">Ca làm việc</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={ShiftType.Morning} />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Ca Sáng: 12:00 - 17:00
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={ShiftType.Afternoon} />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Ca Chiều: 17:00 - 22:00
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={ShiftType.All} />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Cả ngày: 12:00 - 22:00
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={control}
                name="customStartTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thời gian bắt đầu (HH:mm) - Tùy chọn</FormLabel>
                    <FormControl>
                      <Input type="time" placeholder="08:00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="customEndTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thời gian kết thúc (HH:mm) - Tùy chọn</FormLabel>
                    <FormControl>
                      <Input type="time" placeholder="17:00" {...field} />
                    </FormControl>
                    <FormMessage />
                    {timeError && (
                      <p className="text-sm text-red-500 mt-1">{timeError}</p>
                    )}
                  </FormItem>
                )}
              />
            </div>

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
