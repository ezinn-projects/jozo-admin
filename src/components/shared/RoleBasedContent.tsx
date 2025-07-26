import { ReactNode } from "react";
import { Role } from "@/constants/enum";
import { usePermission } from "@/hooks/usePermission";

interface RoleBasedContentProps {
  requiredRoles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}

/**
 * Component để hiển thị nội dung có điều kiện dựa trên role
 * @param requiredRoles - Danh sách roles được phép xem nội dung
 * @param children - Nội dung sẽ hiển thị nếu user có quyền
 * @param fallback - Nội dung thay thế nếu user không có quyền
 * @param showFallback - Có hiển thị fallback hay không
 */
const RoleBasedContent: React.FC<RoleBasedContentProps> = ({
  requiredRoles,
  children,
  fallback = null,
  showFallback = false,
}) => {
  const { hasAccess } = usePermission(requiredRoles);

  if (hasAccess) {
    return <>{children}</>;
  }

  return showFallback ? <>{fallback}</> : null;
};

export default RoleBasedContent;
