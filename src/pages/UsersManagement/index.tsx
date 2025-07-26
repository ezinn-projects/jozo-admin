import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useUsers } from "@/hooks/use-users";
import { User } from "@/@types/user";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import PATHS from "@/constants/paths";
import { DeleteModal } from "@/components/shared/DeleteModal";
import { toast } from "@/hooks/use-toast";

const UsersManagementPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const { users, isLoadingUsers, deleteUser, isDeletingUser } = useUsers();

  // Lọc chỉ users có role "user"
  const regularUsers = users.filter((user: User) => user.role === "user");

  // Lọc users theo search term
  const filteredUsers = regularUsers.filter(
    (user: User) =>
      (user.name || user.full_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone_number.includes(searchTerm)
  );

  const handleDeleteUser = (userId: string) => {
    deleteUser(userId, {
      onSuccess: () => {
        setDeleteUserId(null);
        toast({
          title: "Thành công",
          description: "Xóa user thành công",
        });
      },
    });
  };

  const getUserName = (user: User) => {
    return user.name || user.full_name || "Không có tên";
  };

  if (isLoadingUsers) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý Users</h1>
        <Button onClick={() => navigate(PATHS.USERS_MANAGEMENT_NEW)}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm User
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.map((user: User) => (
          <Card key={user._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">
                      {getUserName(user)}
                    </h3>
                    <Badge variant="secondary">User</Badge>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    {user.username && <p>Username: {user.username}</p>}
                    {user.email && <p>Email: {user.email}</p>}
                    <p>Số điện thoại: {user.phone_number}</p>
                    <p>
                      Ngày sinh:{" "}
                      {format(new Date(user.date_of_birth), "dd/MM/yyyy", {
                        locale: vi,
                      })}
                    </p>
                    <p>
                      Ngày tạo:{" "}
                      {format(new Date(user.created_at), "dd/MM/yyyy HH:mm", {
                        locale: vi,
                      })}
                    </p>
                    {user.status && <p>Trạng thái: {user.status}</p>}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigate(
                        PATHS.USERS_MANAGEMENT_EDIT.replace(":id", user._id)
                      )
                    }
                  >
                    Chỉnh sửa
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteUserId(user._id)}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">
              {searchTerm
                ? "Không tìm thấy user nào phù hợp"
                : "Chưa có user nào"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={!!deleteUserId}
        onClose={() => setDeleteUserId(null)}
        onConfirm={() => deleteUserId && handleDeleteUser(deleteUserId)}
        title="Xóa User"
        description="Bạn có chắc chắn muốn xóa user này? Hành động này không thể hoàn tác."
        isLoading={isDeletingUser}
      />
    </div>
  );
};

export default UsersManagementPage;
