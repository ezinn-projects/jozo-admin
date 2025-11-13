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
import { CalendarIcon, CircleXIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Portal } from "@radix-ui/react-portal";
import { ShiftType } from "@/constants/enum";

// Define schema using zod
const staffScheduleSchema = z.object({
  date: z.date({
    required_error: "Ngày là bắt buộc",
  }),
  shifts: z.array(z.string()).min(1, "Vui lòng chọn ít nhất một ca làm việc"),
  note: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof staffScheduleSchema>;

interface StaffScheduleRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  staffName?: string;
  refetchSchedules?: () => void;
}

const StaffScheduleRegistrationModal: React.FC<
  StaffScheduleRegistrationModalProps
> = ({ isOpen, onClose, userId, staffName, refetchSchedules }) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(staffScheduleSchema),
    defaultValues: {
      date: new Date(),
      shifts: [],
      note: "",
    },
  });

  const { control, handleSubmit, reset, setError } = form;

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
          if (field === "shifts" || field === "date" || field === "note") {
            setError(field as "shifts" | "date" | "note", {
              type: "server",
              message: message,
            });
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
    const dateStr = format(values.date, "yyyy-MM-dd");
    const payload: IRegisterStaffScheduleRequest = {
      userId,
      date: dateStr,
      shifts: values.shifts,
      note: values.note || undefined,
    };
    registerSchedule(payload);
  };

  const handleClose = () => {
    reset();
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
              name="shifts"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Ca làm việc</FormLabel>
                  </div>
                  <div className="space-y-2">
                    <FormField
                      control={control}
                      name="shifts"
                      render={({ field }) => {
                        return (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(
                                  ShiftType.Morning
                                )}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([
                                        ...field.value,
                                        ShiftType.Morning,
                                      ])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== ShiftType.Morning
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Ca Sáng: 12:00 - 17:00
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                    <FormField
                      control={control}
                      name="shifts"
                      render={({ field }) => {
                        return (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(
                                  ShiftType.Afternoon
                                )}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([
                                        ...field.value,
                                        ShiftType.Afternoon,
                                      ])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) =>
                                            value !== ShiftType.Afternoon
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Ca Chiều: 17:00 - 22:00
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
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
              <Button type="submit" disabled={isSubmitting}>
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
