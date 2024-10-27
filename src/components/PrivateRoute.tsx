// components/PrivateRoute.js
import { Role } from "@/constants/enum";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
// import { useAuth } from "../AuthContext";

function PrivateRoute({
  children,
  requiredRoles,
}: {
  children: React.ReactNode;
  requiredRoles: Role[];
}) {
  const { role } = useAuth();

  if (!requiredRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default PrivateRoute;
