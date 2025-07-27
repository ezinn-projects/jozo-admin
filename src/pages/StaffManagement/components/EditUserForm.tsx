import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

// Schema cho form cập nhật user
const updateUserSchema = z.object({
  name: z.string().min(1, "Tên là bắt buộc"),
  username: z.string().min(3, "Username phải có ít nhất 3 ký tự"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  date_of_birth: z.string().min(1, "Ngày sinh là bắt buộc"),
  role: z.nativeEnum(Role, { required_error: "Vai trò là bắt buộc" }),
  phone_number: z.string().min(10, "Số điện thoại phải có ít nhất 10 số"),
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
      date_of_birth: "",
      role: Role.Staff,
      phone_number: "",
    },
  });

  // Cập nhật form khi có dữ liệu user
  useEffect(() => {
    if (user && user._id) {
      form.reset({
        name: user.name || user.full_name || "",
        username: user.username || "",
        email: user.email || "",
        date_of_birth: format(new Date(user.date_of_birth), "yyyy-MM-dd"),
        role: user.role === Role.Admin ? Role.Admin : Role.Staff,
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
      date_of_birth: new Date(data.date_of_birth),
      role: data.role,
      phone_number: data.phone_number,
    };

    updateUser(
      { id, data: updateData },
      {
        onSuccess: () => {
          navigate(PATHS.STAFF_MANAGEMENT);
        },
      }
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
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Chỉnh sửa Admin/Staff</CardTitle>
        </CardHeader>
        <CardContent>
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
                placeholder="Nhập số điện thoại"
              />
              {form.formState.errors.phone_number && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.phone_number.message}
                </p>
              )}
            </div>

            {/* Ngày sinh */}
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Ngày sinh *</Label>
              <Input
                id="date_of_birth"
                type="date"
                {...form.register("date_of_birth")}
              />
              {form.formState.errors.date_of_birth && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.date_of_birth.message}
                </p>
              )}
            </div>

            {/* Vai trò */}
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
