import { User } from "@/@types/user";
import http from "@/utils/http";

type LoginRequest = {
  email: string;
  password: string;
};

const authorizationApis = {
  login: (data: LoginRequest) =>
    http.post<
      HTTPResponse<{
        access_token: string;
        refresh_token: string;
      }>
    >("/users/login", data),
  getMe: () => http.get<HTTPResponse<User>>("/users/get-user"),
};

export default authorizationApis;
