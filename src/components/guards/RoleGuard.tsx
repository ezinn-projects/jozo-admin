import { Navigate, Outlet } from "react-router-dom";
import { Role } from "@/constants/enum";
import useAuth from "@/hooks/useAuth";
import PATHS from "@/constants/paths";

const RoleGuard = ({ requiredRoles }: { requiredRoles: Role[] }) => {
  const { user } = useAuth();

  const hasRequiredRole = requiredRoles.includes(user?.role as Role);
  if (!hasRequiredRole) {
    return <Navigate to={PATHS.UNAUTHORIZED} replace />;
  }

  return <Outlet />;
};

export default RoleGuard;
