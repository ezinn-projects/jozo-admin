// AuthContext.js
import { User } from "@/@types/user";
import authorizationApis from "@/apis/authorization.apis";
import { useQuery } from "@tanstack/react-query";
import { createContext, ReactNode } from "react";

type AuthContextValues = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

const initialAuthContextValues: AuthContextValues = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
};

// Tạo AuthContext
export const AuthContext = createContext<AuthContextValues>(
  initialAuthContextValues
);

// Provider component để bọc toàn bộ app
export function AuthProvider({ children }: { children: ReactNode }) {
  // Giả lập một role, trong thực tế bạn sẽ lấy role từ API hoặc authentication state

  const { data: userData, isLoading } = useQuery({
    queryKey: ["user", !!localStorage.getItem("access_token")],
    queryFn: authorizationApis.getMe,
    enabled: !!localStorage.getItem("access_token"), // Chỉ chạy query nếu có token
  });

  const value = {
    user: userData?.data.result || null,
    isAuthenticated: !!userData?.data.result,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
