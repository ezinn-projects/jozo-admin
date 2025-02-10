// AuthContext.js
import { User } from "@/@types/user";
import authorizationApis from "@/apis/authorization.apis";
import { useQuery } from "@tanstack/react-query";
import { createContext, ReactNode, useEffect } from "react";
import { AUTH_EVENTS } from "@/constants/events";

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

  const {
    data: userData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["user", localStorage.getItem("access_token")],
    queryFn: authorizationApis.getMe,
    enabled: !!localStorage.getItem("access_token"), // Chỉ chạy query nếu có token
  });

  // Thêm effect để lắng nghe sự kiện đăng nhập
  useEffect(() => {
    const handleLoginSuccess = () => {
      console.log("Login success event received");
      refetch();
    };

    window.addEventListener(AUTH_EVENTS.LOGIN_SUCCESS, handleLoginSuccess);

    return () => {
      window.removeEventListener(AUTH_EVENTS.LOGIN_SUCCESS, handleLoginSuccess);
    };
  }, [refetch]);

  const value = {
    user: userData?.data.result || null,
    isAuthenticated: !!userData?.data.result,
    isLoading,
  };

  console.log("AuthContext value:", value);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
