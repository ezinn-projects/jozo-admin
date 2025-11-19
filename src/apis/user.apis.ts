import http from "@/utils/http";
import {
  CreateUserRequest,
  UpdateUserRequest,
  UsersResponse,
  UserResponse,
  ChangePasswordRequestBody,
  ChangePasswordResponse,
} from "@/@types/user";

export const userApis = {
  // Lấy danh sách tất cả users
  getAllUsers: () => {
    return http.get<UsersResponse>("/users");
  },

  // Lấy thông tin user theo ID
  getUserById: (id: string) => {
    return http.get<UserResponse>(`/users/${id}`);
  },

  // Tạo user mới
  createUser: (data: CreateUserRequest) => {
    return http.post<UserResponse>("/users/register", data);
  },

  // Cập nhật user
  updateUser: (id: string, data: UpdateUserRequest) => {
    return http.put<UserResponse>(`/users/${id}`, data);
  },

  // Xóa user
  deleteUser: (id: string) => {
    return http.delete(`/users/${id}`);
  },

  // Đổi mật khẩu
  changePassword: (data: ChangePasswordRequestBody) => {
    return http.post<ChangePasswordResponse>("/users/change-password", data);
  },
};
