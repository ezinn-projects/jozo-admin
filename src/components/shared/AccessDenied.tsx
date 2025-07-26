import { Lock } from "lucide-react";
import Typography from "../ui/typography";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import PATHS from "@/constants/paths";

interface AccessDeniedProps {
  title?: string;
  message?: string;
  showBackButton?: boolean;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({
  title = "Không có quyền truy cập",
  message = "Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản trị viên để được hỗ trợ.",
  showBackButton = true,
}) => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate(PATHS.HOME);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-red-100 rounded-full">
            <Lock className="w-12 h-12 text-red-600" />
          </div>
        </div>

        <div className="space-y-2">
          <Typography variant="h2" className="text-2xl font-bold text-gray-900">
            {title}
          </Typography>
          <Typography variant="p" className="text-gray-600 max-w-md">
            {message}
          </Typography>
        </div>

        {showBackButton && (
          <Button onClick={handleBackToHome} className="mt-4">
            Về trang chủ
          </Button>
        )}
      </div>
    </div>
  );
};

export default AccessDenied;
