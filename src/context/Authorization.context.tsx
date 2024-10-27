// AuthContext.js
import { Role } from "@/constants/enum";
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
};

const initialAuthContextValues: AuthContextValues = {
  role: Role.Admin,
  setRole: () => {},
};

// Tạo AuthContext
export const AuthContext = createContext<AuthContextValues>(
  initialAuthContextValues
);

// Provider component để bọc toàn bộ app
export function AuthProvider({ children }: { children: ReactNode }) {
  // Giả lập một role, trong thực tế bạn sẽ lấy role từ API hoặc authentication state
  const [role, setRole] = useState<Role>(Role.Admin); // hoặc 'admin', 'staff' tùy vào người dùng

  const value = useMemo(() => {
    return { role, setRole };
  }, [role]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
