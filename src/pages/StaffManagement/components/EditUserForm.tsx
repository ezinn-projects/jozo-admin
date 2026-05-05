import { PageHeader } from "@/components/shared";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, UserCog } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Role } from "@/constants/enum";
import { UpdateUserRequest, User } from "@/@types/user";
import { useUsers } from "@/hooks/use-users";
import { useNavigate, useParams } from "react-router-dom";
import PATHS from "@/constants/paths";
import { format } from "date-fns";
import { cn } from "@/utils";

const splitIsoToDateAndTime = (iso?: string | null): {
  date?: Date;
  time: string;
} => {
  if (!iso) return { time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { time: "" };
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: dateOnly,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
};

const combineDateAndTimeToIso = (
  date?: Date,
  time?: string,
): string | null => {
  if (!date) return null;
  const trimmed = time?.trim();
  const parts = trimmed ? trimmed.split(":") : ["0", "0"];
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  const out = new Date(date);
  out.setHours(
    Number.isFinite(h) ? h : 0,
    Number.isFinite(m) ? m : 0,
    0,
    0,
  );
  return out.toISOString();
};

// Schema cho form cập nhật user
const updateUserSchema = z
  .object({
    name: z.string().min(1, "Tên là bắt buộc"),
    username: z.string().min(3, "Username phải có ít nhất 3 ký tự"),
    email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
    date_of_birth: z.coerce.date({
      required_error: "Ngày sinh là bắt buộc",
      invalid_type_error: "Ngày sinh không hợp lệ",
    }),
    role: z.nativeEnum(Role, { required_error: "Vai trò là bắt buộc" }),
    phone_number: z.string().min(10, "Số điện thoại phải có ít nhất 10 số"),
    probationStartDate: z.date().optional(),
    probationStartTime: z.string().optional(),
    probationEndDate: z.date().optional(),
    probationEndTime: z.string().optional(),
    probationHourlyRateStr: z.string().optional(),
    probationHolidayMultiplierStr: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const m = data.probationHolidayMultiplierStr?.trim();
    if (!m) return;
    const n = Number(m.replace(/\s/g, "").replace(",", "."));
    if (!Number.isFinite(n) || n < 0 || n > 20) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Hệ số ngày lễ (thử việc) phải từ 0 đến 20",
        path: ["probationHolidayMultiplierStr"],
      });
    }
  });

type UpdateUserFormData = z.infer<typeof updateUserSchema>;

const EditUserForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { updateUser, useUserById, isUpdatingUser } = useUsers();

  const { data: userData, isLoading: isLoadingUser } = useUserById(id || "");

  const user = userData?.data?.result || ({} as User);

  const form = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      date_of_birth: undefined,
      role: Role.Staff,
      phone_number: "",
      probationStartDate: undefined,
      probationStartTime: "",
      probationEndDate: undefined,
      probationEndTime: "",
      probationHourlyRateStr: "",
      probationHolidayMultiplierStr: "",
    },
  });

  useEffect(() => {
    if (user && user._id) {
      const start = splitIsoToDateAndTime(user.probationStartDate);
      const end = splitIsoToDateAndTime(user.probationEndDate);
      form.reset({
        name: user.name || user.full_name || "",
        username: user.username || "",
        email: user.email || "",
        date_of_birth: new Date(user.date_of_birth),
        role: user.role === Role.Admin ? Role.Admin : Role.Staff,
        phone_number: user.phone_number,
        probationStartDate: start.date,
        probationStartTime: start.time,
        probationEndDate: end.date,
        probationEndTime: end.time,
        probationHourlyRateStr:
          user.probationHourlyRate != null &&
          !Number.isNaN(user.probationHourlyRate)
            ? String(user.probationHourlyRate)
            : "",
        probationHolidayMultiplierStr:
          user.probationHolidayMultiplier != null &&
          !Number.isNaN(user.probationHolidayMultiplier)
            ? String(user.probationHolidayMultiplier)
            : "",
      });
    }
  }, [user, form]);

  const onSubmit = (data: UpdateUserFormData) => {
    if (!id) return;

    const parseRate = (raw?: string): number | null => {
      const t = raw?.trim();
      if (!t) return null;
      const n = Number(t.replace(/\s/g, "").replace(/\./g, "").replace(/,/g, ""));
      if (!Number.isFinite(n) || n < 0) return null;
      return n;
    };

    const parseMultiplier = (raw?: string): number | null => {
      const t = raw?.trim();
      if (!t) return null;
      const n = Number(t.replace(/\s/g, "").replace(",", "."));
      if (!Number.isFinite(n) || n < 0 || n > 20) return null;
      return n;
    };

    const updateData: UpdateUserRequest = {
      name: data.name,
      username: data.username,
      email: data.email || undefined,
      date_of_birth: data.date_of_birth,
      role: data.role,
      phone_number: data.phone_number,
      probationStartDate: combineDateAndTimeToIso(
        data.probationStartDate,
        data.probationStartTime,
      ),
      probationEndDate: combineDateAndTimeToIso(
        data.probationEndDate,
        data.probationEndTime,
      ),
      probationHourlyRate: parseRate(data.probationHourlyRateStr),
      probationHolidayMultiplier: parseMultiplier(
        data.probationHolidayMultiplierStr,
      ),
    };

    updateUser(
      { id, data: updateData },
      {
        onSuccess: () => {
          navigate(PATHS.STAFF_MANAGEMENT);
        },
      },
    );
  };

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chỉnh sửa Admin/Staff"
        description="Cập nhật thông tin quản trị viên hoặc nhân viên"
        icon={UserCog}
        showBackButton
        backUrl={PATHS.STAFF_MANAGEMENT}
      />
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Tên *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Nhập tên đầy đủ"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                {...form.register("username")}
                placeholder="Nhập username (dùng để đăng nhập)"
              />
              {form.formState.errors.username && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder="Nhập email (tùy chọn)"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Số điện thoại *</Label>
              <Input
                id="phone_number"
                {...form.register("phone_number")}
                placeholder="Nhập số điện thoại"
              />
              {form.formState.errors.phone_number && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.phone_number.message}
                </p>
              )}
            </div>

            <Controller
              control={form.control}
              name="date_of_birth"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>Ngày sinh *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value
                          ? format(field.value, "dd/MM/yyyy")
                          : "Chọn ngày"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => date && field.onChange(date)}
                        captionLayout="dropdown-buttons"
                        fromYear={1950}
                        toYear={new Date().getFullYear()}
                        disabled={{ after: new Date() }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.date_of_birth && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.date_of_birth.message}
                    </p>
                  )}
                </div>
              )}
            />

            <div className="space-y-2">
              <Label htmlFor="role">Vai trò *</Label>
              <Select
                value={form.watch("role")}
                onValueChange={(value) => form.setValue("role", value as Role)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Role.Staff}>Staff</SelectItem>
                  <SelectItem value={Role.Admin}>Admin</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.role && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.role.message}
                </p>
              )}
            </div>

            <div className="border-t pt-6 space-y-4">
              <div>
                <div className="text-base font-semibold">
                  Thử việc &amp; lương
                </div>
                <p className="text-sm text-muted-foreground">
                  Chọn ngày trên lịch và giờ riêng. Để trống và lưu để xóa cấu
                  hình.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Bắt đầu thử việc</Label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Controller
                      control={form.control}
                      name="probationStartDate"
                      render={({ field }) => (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                "justify-start text-left font-normal sm:flex-1",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                              {field.value
                                ? format(field.value, "dd/MM/yyyy")
                                : "Chọn ngày"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(d) => field.onChange(d)}
                              captionLayout="dropdown-buttons"
                              fromYear={2000}
                              toYear={new Date().getFullYear() + 5}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                    <Input
                      type="time"
                      className="sm:w-[140px]"
                      {...form.register("probationStartTime")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => {
                        form.setValue("probationStartDate", undefined);
                        form.setValue("probationStartTime", "");
                      }}
                    >
                      Xóa
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Kết thúc thử việc</Label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Controller
                      control={form.control}
                      name="probationEndDate"
                      render={({ field }) => (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                "justify-start text-left font-normal sm:flex-1",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                              {field.value
                                ? format(field.value, "dd/MM/yyyy")
                                : "Chọn ngày"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(d) => field.onChange(d)}
                              captionLayout="dropdown-buttons"
                              fromYear={2000}
                              toYear={new Date().getFullYear() + 10}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                    <Input
                      type="time"
                      className="sm:w-[140px]"
                      {...form.register("probationEndTime")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => {
                        form.setValue("probationEndDate", undefined);
                        form.setValue("probationEndTime", "");
                      }}
                    >
                      Xóa
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="probationHourlyRateStr">
                    Lương giờ (thử việc)
                  </Label>
                  <Input
                    id="probationHourlyRateStr"
                    inputMode="numeric"
                    {...form.register("probationHourlyRateStr")}
                    placeholder="Để trống để xóa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="probationHolidayMultiplierStr">
                    Hệ số ngày lễ (0–20)
                  </Label>
                  <Input
                    id="probationHolidayMultiplierStr"
                    inputMode="decimal"
                    {...form.register("probationHolidayMultiplierStr")}
                    placeholder="Để trống để xóa"
                  />
                  {form.formState.errors.probationHolidayMultiplierStr && (
                    <p className="text-sm text-red-500">
                      {
                        form.formState.errors.probationHolidayMultiplierStr
                          .message
                      }
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isUpdatingUser}
                className="flex-1"
              >
                {isUpdatingUser ? "Đang xử lý..." : "Cập nhật"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(PATHS.STAFF_MANAGEMENT)}
                className="flex-1"
              >
                Hủy
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditUserForm;
