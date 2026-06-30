import {
  ForgotPasswordRequestBody,
  ResetPasswordRequestBody,
  User,
} from "@/@types/user";
import http from "@/utils/http";

type LoginRequest = {
  username: string;
  password: string;
};

type LogoutRequest = {
  refresh_token: string;
};

const authorizationApis = {
  login: (data: LoginRequest) =>
    http.post<
      HTTPResponse<{
        access_token: string;
        refresh_token: string;
      }>
    >("/users/login", data),
  logout: (data: LogoutRequest) =>
    http.post<HTTPResponse<void>>("/users/logout", data),
  getMe: () => http.get<HTTPResponse<User>>("/users/get-user"),
  getUsers: () => http.get<HTTPResponse<User[]>>("/users"),
  forgotPassword: (data: ForgotPasswordRequestBody) =>
    http.post<HTTPResponse<void>>("/users/forgot-password", data, {
      skipErrorToast: true,
    }),
  resetPassword: (data: ResetPasswordRequestBody) =>
    http.post<HTTPResponse<void>>("/users/reset-password", data, {
      skipErrorToast: true,
    }),
};

export default authorizationApis;
