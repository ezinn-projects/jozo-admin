// AuthContext.js
import { User } from "@/@types/user";
import authorizationApis from "@/apis/authorization.apis";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  const {
    data: userData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["user", localStorage.getItem("access_token")],
    queryFn: authorizationApis.getMe,
    enabled: !!localStorage.getItem("access_token"),
  });

  // Thêm effect để lắng nghe sự kiện đăng nhập và đăng xuất
  useEffect(() => {
    const handleLoginSuccess = () => {
      console.log("Login success event received");
      refetch();
    };

    const handleLogoutSuccess = () => {
      console.log("Logout success event received");
      // Reset query cache khi logout
      queryClient.clear();
    };

    window.addEventListener(AUTH_EVENTS.LOGIN_SUCCESS, handleLoginSuccess);
    window.addEventListener(AUTH_EVENTS.LOGOUT_SUCCESS, handleLogoutSuccess);

    return () => {
      window.removeEventListener(AUTH_EVENTS.LOGIN_SUCCESS, handleLoginSuccess);
      window.removeEventListener(
        AUTH_EVENTS.LOGOUT_SUCCESS,
        handleLogoutSuccess
      );
    };
  }, [refetch, queryClient]);

  const value = {
    user: userData?.data.result || null,
    isAuthenticated: !!userData?.data.result,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
