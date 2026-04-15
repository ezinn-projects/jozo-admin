import { PageHeader } from "@/components/shared";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, UserCog, Gift } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UpdateUserRequest, User } from "@/@types/user";
import { useUsers } from "@/hooks/use-users";
import { useNavigate, useParams } from "react-router-dom";
import PATHS from "@/constants/paths";
import { format } from "date-fns";
import {
  useUpdateMemberPoints,
  useUpdateMemberStreak,
  usePendingGifts,
  useMemberStreakInfo,
} from "@/hooks/use-membership";
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

const updateStreakSchema = z.object({
  count: z.coerce.number().min(0, "Streak không được âm"),
});

type UpdateStreakFormData = z.infer<typeof updateStreakSchema>;

const EditUserForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { updateUser, useUserById, useUserMembership, isUpdatingUser } =
    useUsers();
  const { mutate: updateMemberPoints, isPending: isUpdatingMemberPoints } =
    useUpdateMemberPoints(id);
  const { mutate: updateMemberStreak, isPending: isUpdatingMemberStreak } =
    useUpdateMemberStreak(id);

  const { data: userData, isLoading: isLoadingUser } = useUserById(id || "");
  const { data: membershipData, isLoading: isLoadingMembership } =
    useUserMembership(id || "");

  const user = userData?.data?.result as User | undefined;
  const membershipDetail = membershipData?.data?.result;

  // Lấy thông tin quà của user
  const { data: pendingGiftsData, isLoading: isLoadingGifts } = usePendingGifts(
    user?.phone_number,
  );

  // Lấy thông tin streak và quà đã claim
  const { data: streakInfoData, isLoading: isLoadingStreakInfo } =
    useMemberStreakInfo(id);

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

  const streakForm = useForm<UpdateStreakFormData>({
    resolver: zodResolver(updateStreakSchema),
    defaultValues: { count: 0 },
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

  // Cập nhật streak form khi có dữ liệu membership
  useEffect(() => {
    if (membershipStreak !== undefined) {
      streakForm.reset({ count: membershipStreak });
    }
  }, [membershipStreak, streakForm]);

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
      },
    );
  };

  const onSubmitPoints = (data: UpdatePointsFormData) => {
    if (!id) return;
    updateMemberPoints(data, {
      onSuccess: () => pointsForm.reset({ points: 0, reason: "" }),
    });
  };

  const onSubmitStreak = (data: UpdateStreakFormData) => {
    if (!id) return;
    updateMemberStreak(data);
  };

  const onResetStreak = () => {
    if (!id) return;
    if (window.confirm("Bạn có chắc chắn muốn reset streak về 0?")) {
      updateMemberStreak({ reset: true });
    }
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
                <div className="text-sm text-muted-foreground">
                  Loyalty / Hạng hiện tại
                </div>
                <div className="text-2xl font-semibold">{membershipTier}</div>
              </div>
              <div className="space-y-1 rounded-lg border p-4 sm:col-span-2">
                <div className="text-sm text-muted-foreground">
                  Hạng kế tiếp
                </div>
                <div className="text-lg font-medium leading-tight">
                  {nextTierLabel}
                </div>
              </div>
              <div className="sm:col-span-2 border-t pt-4 space-y-4">
                <div>
                  <div className="text-base font-semibold">Cập nhật Streak</div>
                  <p className="text-sm text-muted-foreground">
                    Thiết lập số lượng streak hiện tại cho thành viên này.
                  </p>
                </div>
                <form
                  onSubmit={streakForm.handleSubmit(onSubmitStreak)}
                  className="grid gap-4 sm:grid-cols-2"
                >
                  <div className="space-y-2">
                    <Label htmlFor="streak-count">Streak *</Label>
                    <Input
                      id="streak-count"
                      type="number"
                      step="1"
                      min="0"
                      {...streakForm.register("count")}
                      placeholder="Nhập số streak"
                    />
                    {streakForm.formState.errors.count && (
                      <p className="text-sm text-red-500">
                        {streakForm.formState.errors.count.message}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2 flex gap-2">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isUpdatingMemberStreak}
                    >
                      {isUpdatingMemberStreak
                        ? "Đang cập nhật..."
                        : "Cập nhật Streak"}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={onResetStreak}
                      disabled={isUpdatingMemberStreak}
                    >
                      Reset Streak
                    </Button>
                  </div>
                </form>
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
      {/* Card hiển thị quà của user */}
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Quà tặng của User</h3>
            </div>
            {isLoadingGifts || isLoadingStreakInfo ? (
              <div className="text-muted-foreground">Đang tải...</div>
            ) : (
              <div className="space-y-6">
                {/* Quà đã claim */}
                {streakInfoData?.claimedRewards &&
                  streakInfoData.claimedRewards.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-base font-medium text-blue-600">
                        Quà đã nhận ({streakInfoData.claimedRewards.length})
                      </div>
                      <div className="grid gap-3">
                        {streakInfoData.claimedRewards.map((reward, index) => (
                          <div
                            key={`${reward.streakCount}-${index}`}
                            className="flex items-start gap-3 p-3 border rounded-lg bg-blue-50"
                          >
                            <div className="flex-1">
                              <div className="font-medium">
                                {reward.gift ? (
                                  <span>🎁 {reward.gift.giftName}</span>
                                ) : (
                                  <span>💰 {reward.points} điểm</span>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Streak: {reward.streakCount}
                                {reward.gift &&
                                  ` • Loại: ${reward.gift.giftType}`}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Nhận lúc:{" "}
                                {new Date(reward.claimedAt).toLocaleString(
                                  "vi-VN",
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Quà đang chờ claim */}
                {pendingGiftsData?.pending &&
                  pendingGiftsData.pending.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-base font-medium text-orange-600">
                        Quà chờ nhận ({pendingGiftsData.pending.length})
                      </div>
                      <div className="grid gap-3">
                        {pendingGiftsData.pending.map((gift) => (
                          <div
                            key={gift.rewardHistoryId}
                            className="flex items-center gap-3 p-3 border rounded-lg bg-orange-50"
                          >
                            {gift.giftImage && (
                              <img
                                src={gift.giftImage}
                                alt={gift.giftName}
                                className="h-12 w-12 rounded object-cover"
                              />
                            )}
                            <div className="flex-1">
                              <div className="font-medium">{gift.giftName}</div>
                              <div className="text-sm text-muted-foreground">
                                Loại: {gift.giftType} • Streak:{" "}
                                {gift.streakCount}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Nhận lúc:{" "}
                                {new Date(gift.assignedAt).toLocaleString(
                                  "vi-VN",
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Quà đủ điều kiện nhận */}
                {pendingGiftsData?.eligible &&
                  pendingGiftsData.eligible.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-base font-medium text-green-600">
                        Quà đủ điều kiện nhận (
                        {pendingGiftsData.eligible.length})
                      </div>
                      <div className="grid gap-3">
                        {pendingGiftsData.eligible.map((gift, index) => (
                          <div
                            key={`${gift.giftId}-${index}`}
                            className="flex items-center gap-3 p-3 border rounded-lg bg-green-50"
                          >
                            {gift.giftImage && (
                              <img
                                src={gift.giftImage}
                                alt={gift.giftName}
                                className="h-12 w-12 rounded object-cover"
                              />
                            )}
                            <div className="flex-1">
                              <div className="font-medium">{gift.giftName}</div>
                              <div className="text-sm text-muted-foreground">
                                Loại: {gift.giftType} • Streak:{" "}
                                {gift.streakCount}
                              </div>
                              {gift.bonusPoints && (
                                <div className="text-xs text-green-600 font-medium">
                                  Thưởng: +{gift.bonusPoints} điểm
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Thông tin streak */}
                {streakInfoData?.streak && (
                  <div className="pt-4 border-t">
                    <div className="text-sm font-medium mb-2">
                      Thông tin Streak
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        Streak hiện tại:{" "}
                        <span className="font-medium text-foreground">
                          {streakInfoData.streak.count}
                        </span>
                      </div>
                      <div>
                        Trạng thái:{" "}
                        <span
                          className={`font-medium ${
                            streakInfoData.streak.isActive
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {streakInfoData.streak.isActive
                            ? "Đang hoạt động"
                            : "Không hoạt động"}
                        </span>
                      </div>
                      <div>
                        Lần ghé thăm cuối:{" "}
                        <span className="font-medium text-foreground">
                          {new Date(
                            streakInfoData.streak.lastVisitAt,
                          ).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <div>
                        Hết hạn lúc:{" "}
                        <span className="font-medium text-foreground">
                          {new Date(
                            streakInfoData.streak.expiredAt,
                          ).toLocaleString("vi-VN")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Thông tin user từ pending gifts response */}
                {pendingGiftsData?.user && (
                  <div className="pt-4 border-t">
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        Hạng:{" "}
                        <span className="font-medium text-foreground">
                          {pendingGiftsData.user.tier}
                        </span>
                      </div>
                      <div>
                        Điểm hiện có:{" "}
                        <span className="font-medium text-foreground">
                          {pendingGiftsData.user.availablePoint.toLocaleString(
                            "vi-VN",
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Không có quà */}
                {(!streakInfoData?.claimedRewards ||
                  streakInfoData.claimedRewards.length === 0) &&
                  (!pendingGiftsData?.pending ||
                    pendingGiftsData.pending.length === 0) &&
                  (!pendingGiftsData?.eligible ||
                    pendingGiftsData.eligible.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      User hiện không có quà nào
                    </div>
                  )}
              </div>
            )}
          </div>
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
