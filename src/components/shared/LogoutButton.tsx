import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/useLogout";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export const LogoutButton = ({
  variant = "ghost",
  size = "icon",
  className,
  showIcon = true,
  children,
}: LogoutButtonProps) => {
  const { logout, isLoading } = useLogout();

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={logout}
      disabled={isLoading}
      title="Đăng xuất"
    >
      {showIcon && <LogOut className="w-5 h-5" />}
      {children && <span className="ml-2">{children}</span>}
    </Button>
  );
};
