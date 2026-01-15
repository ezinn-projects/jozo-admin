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
import { UpdateUserRequest, User } from "@/@types/user";
import { useUsers } from "@/hooks/use-users";
import { useNavigate, useParams } from "react-router-dom";
import PATHS from "@/constants/paths";
import { format } from "date-fns";
import { useUpdateMemberPoints } from "@/hooks/use-membership";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/utils";

// Schema cho form cập nhật user
const updateUserSchema = z.object({
  name: z.string().min(1, "Tên là bắt buộc"),
  username: z.string().min(3, "Username phải có ít nhất 3 ký tự"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  date_of_birth: z.coerce.date({
    required_error: "Ngày sinh là bắt buộc",
    invalid_type_error: "Ngày sinh không hợp lệ",
  }),
  phone_number: z
    .string()
    .regex(/^\d{10,11}$/, "Số điện thoại phải gồm 10-11 chữ số"),
});

type UpdateUserFormData = z.infer<typeof updateUserSchema>;

const updatePointsSchema = z.object({
  points: z.coerce.number().positive("Điểm phải lớn hơn 0"),
  reason: z.string().optional(),
});

type UpdatePointsFormData = z.infer<typeof updatePointsSchema>;

const EditUserForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { updateUser, useUserById, useUserMembership, isUpdatingUser } =
    useUsers();
  const { mutate: updateMemberPoints, isPending: isUpdatingMemberPoints } =
    useUpdateMemberPoints(id);

  const { data: userData, isLoading: isLoadingUser } = useUserById(id || "");
  const { data: membershipData, isLoading: isLoadingMembership } =
    useUserMembership(id || "");

  const user = userData?.data?.result as User | undefined;
  const membershipDetail = membershipData?.data?.result;

  const formatNumber = (value?: number) =>
    typeof value === "number" ? value.toLocaleString("vi-VN") : "—";

  const membershipPoints =
    membershipDetail?.user?.points ??
    membershipDetail?.user?.loyalty_points ??
    membershipDetail?.user?.loyalty;

  const membershipStreak =
    membershipDetail?.user?.streak ?? membershipDetail?.user?.current_streak;

  const membershipTier =
    (typeof membershipDetail?.progress?.currentTier === "string"
      ? membershipDetail.progress.currentTier
      : membershipDetail?.progress?.currentTier?.tier) ??
    membershipDetail?.user?.tier ??
    "Chưa có";

  const nextTier = membershipDetail?.progress?.nextTier;
  const nextTierLabel = nextTier
    ? `${nextTier.tier}${
        typeof nextTier.required === "number"
          ? ` (cần thêm ${formatNumber(nextTier.required)} điểm)`
          : ""
      }`
    : "Đã ở hạng cao nhất";

  const form = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      date_of_birth: undefined,
      phone_number: "",
    },
  });

  const normalizePhone = (value: string) =>
    value.replace(/\D/g, "").slice(0, 11);

  const pointsForm = useForm<UpdatePointsFormData>({
    resolver: zodResolver(updatePointsSchema),
    defaultValues: { points: 0, reason: "" },
  });

  // Cập nhật form khi có dữ liệu user
  useEffect(() => {
    if (user && user._id) {
      form.reset({
        name: user.name || user.full_name || "",
        username: user.username || "",
        email: user.email || "",
        date_of_birth: new Date(user.date_of_birth),
        phone_number: user.phone_number,
      });
    }
  }, [user, form]);

  const onSubmit = (data: UpdateUserFormData) => {
    if (!id) return;

    const updateData: UpdateUserRequest = {
      name: data.name,
      username: data.username,
      email: data.email || undefined,
      date_of_birth: data.date_of_birth,
      phone_number: data.phone_number,
    };

    updateUser(
      { id, data: updateData },
      {
        onSuccess: () => {
          navigate(PATHS.USERS_MANAGEMENT);
        },
      }
    );
  };

  const onSubmitPoints = (data: UpdatePointsFormData) => {
    if (!id) return;
    updateMemberPoints(data, {
      onSuccess: () => pointsForm.reset({ points: 0, reason: "" }),
    });
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
        title="Chỉnh sửa User"
        description="Cập nhật thông tin người dùng"
        icon={UserCog}
        showBackButton
        backUrl={PATHS.USERS_MANAGEMENT}
      />
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          {isLoadingMembership ? (
            <div className="text-muted-foreground">
              Đang tải thông tin membership...
            </div>
          ) : membershipDetail ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1 rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">Điểm</div>
                <div className="text-2xl font-semibold">
                  {formatNumber(membershipPoints)}
                </div>
              </div>
              <div className="space-y-1 rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">Streak</div>
                <div className="text-2xl font-semibold">
                  {formatNumber(membershipStreak)}
                </div>
              </div>
              <div className="space-y-1 rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">
                  Loyalty / Hạng hiện tại
                </div>
                <div className="text-2xl font-semibold">{membershipTier}</div>
              </div>
              <div className="space-y-1 rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">
                  Hạng kế tiếp
                </div>
                <div className="text-lg font-medium leading-tight">
                  {nextTierLabel}
                </div>
              </div>
              <div className="sm:col-span-2 border-t pt-4 space-y-4">
                <div>
                  <div className="text-base font-semibold">
                    Cập nhật điểm thành viên
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Nhập số điểm cần cộng cho thành viên này (lớn hơn 0).
                  </p>
                </div>
                <form
                  onSubmit={pointsForm.handleSubmit(onSubmitPoints)}
                  className="grid gap-4 sm:grid-cols-2"
                >
                  <div className="space-y-2">
                    <Label htmlFor="points">Điểm *</Label>
                    <Input
                      id="points"
                      type="number"
                      step="1"
                      {...pointsForm.register("points")}
                      placeholder="Nhập số điểm"
                    />
                    {pointsForm.formState.errors.points && (
                      <p className="text-sm text-red-500">
                        {pointsForm.formState.errors.points.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="reason">Lý do</Label>
                    <Input
                      id="reason"
                      {...pointsForm.register("reason")}
                      placeholder="Nhập lý do (tùy chọn)"
                    />
                    {pointsForm.formState.errors.reason && (
                      <p className="text-sm text-red-500">
                        {pointsForm.formState.errors.reason.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="sm:col-span-2"
                    disabled={isUpdatingMemberPoints}
                  >
                    {isUpdatingMemberPoints
                      ? "Đang cập nhật..."
                      : "Cập nhật điểm"}
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">
              Không có thông tin membership.
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Tên */}
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

            {/* Username */}
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

            {/* Email */}
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

            {/* Số điện thoại */}
            <div className="space-y-2">
              <Label htmlFor="phone_number">Số điện thoại *</Label>
              <Input
                id="phone_number"
                {...form.register("phone_number")}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={11}
                onChange={(e) => {
                  const normalized = normalizePhone(e.target.value);
                  form.setValue("phone_number", normalized, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                placeholder="Nhập số điện thoại"
              />
              {form.formState.errors.phone_number && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.phone_number.message}
                </p>
              )}
            </div>

            {/* Ngày sinh */}
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
                          !field.value && "text-muted-foreground"
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

            {/* Buttons */}
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
                onClick={() => navigate(PATHS.USERS_MANAGEMENT)}
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
