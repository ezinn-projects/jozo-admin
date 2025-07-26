// components/PrivateRoute.js
import { Role } from "@/constants/enum";
import useAuth from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import PATHS from "@/constants/paths";

function PrivateRoute({
  children,
  requiredRoles,
}: {
  children: React.ReactNode;
  requiredRoles: Role[];
}) {
  const { user } = useAuth();

  // Nếu chưa đăng nhập, chuyển về trang login
  if (!user) {
    return <Navigate to={PATHS.LOGIN} replace />;
  }

  // Nếu không đủ quyền, chuyển về unauthorized
  if (!requiredRoles.includes(user.role as Role)) {
    return <Navigate to={PATHS.UNAUTHORIZED} replace />;
  }

  return children;
}

export default PrivateRoute;
