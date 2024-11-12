import PATHS from "@/constants/paths";
import useAuth from "@/hooks/useAuth";
import { Navigate, Outlet } from "react-router-dom";

const AuthGuard = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={PATHS.LOGIN} replace />;
  }

  return <Outlet />;
};

export default AuthGuard;
