// AuthContext.js
import { User } from "@/@types/user";
import authorizationApis from "@/apis/authorization.apis";
import { Role } from "@/constants/enum";
import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  type Dispatch,
  ReactNode,
  type SetStateAction,
  useMemo,
  useState,
} from "react";

type AuthContextValues = {
  role: Role;
  setRole: Dispatch<SetStateAction<Role>>;
  user: User | null;
  isAuthenticated: boolean;
};

const initialAuthContextValues: AuthContextValues = {
  role: Role.Admin,
  setRole: () => {},
  user: null,
  isAuthenticated: false,
};

// Tạo AuthContext
export const AuthContext = createContext<AuthContextValues>(
  initialAuthContextValues
);

// Provider component để bọc toàn bộ app
export function AuthProvider({ children }: { children: ReactNode }) {
  // Giả lập một role, trong thực tế bạn sẽ lấy role từ API hoặc authentication state
  const [role, setRole] = useState<Role>(Role.Admin); // hoặc 'admin', 'staff' tùy vào người dùng

  // useQuery để lấy thông tin người dùng dựa trên access_token trong localStorage
  const { data: userData } = useQuery({
    queryKey: ["user"],
    queryFn: authorizationApis.getMe,
    enabled: !!localStorage.getItem("access_token"), // Chỉ chạy query nếu có token
  });

  const value = useMemo(() => {
    return {
      role,
      setRole,
      user: userData?.data.result || null,
      isAuthenticated: !!userData?.data.result,
    };
  }, [role, userData, setRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
