import PATHS from "@/constants/paths";
import useAuth from "@/hooks/useAuth";
import { Navigate, Outlet } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";

const AuthGuard = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          {/* Logo/Text với hiệu ứng */}
          <div className="relative">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
              Jozo
            </h1>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce"></div>
          </div>

          {/* Spinner */}
          <div className="flex justify-center">
            <Spinner
              size="large"
              className="border-blue-500 border-t-transparent"
            />
          </div>

          {/* Loading text với hiệu ứng */}
          <div className="space-y-2">
            <p className="text-gray-600 font-medium">Đang tải...</p>
            <div className="flex justify-center space-x-1">
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></div>
              <div
                className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></div>
              <div
                className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={PATHS.LOGIN} replace />;
  }

  return <Outlet />;
};

export default AuthGuard;
