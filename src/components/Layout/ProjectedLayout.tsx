import { Outlet, Navigate } from "react-router-dom";
// import { useAuth } from "@/hooks/useAuth"; // Giả sử bạn có hook để lấy trạng thái đăng nhập của user
import { Role } from "@/constants/enum";
import useAuth from "@/hooks/useAuth";

const ProtectedLayout = ({ requiredRoles }: { requiredRoles: Role[] }) => {
  const { isAuthenticated, user } = useAuth();

  console.log("isAuthenticated", isAuthenticated);
  console.log("user", user);

  if (!isAuthenticated && !user) {
    return <Navigate to="/login" replace />;
  }

  const hasRequiredRole = requiredRoles.includes(user?.role as Role);
  if (!hasRequiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedLayout;
