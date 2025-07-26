import { useMemo } from "react";
import { Role } from "@/constants/enum";
import useAuth from "./useAuth";

/**
 * Hook để kiểm tra quyền truy cập dựa trên role
 * @param requiredRoles - Danh sách roles được phép truy cập
 * @returns Object chứa thông tin về quyền truy cập
 */
export const usePermission = (requiredRoles: Role[]) => {
  const { user } = useAuth();

  const permission = useMemo(() => {
    if (!user) {
      return {
        hasAccess: false,
        userRole: null,
        requiredRoles,
        isAdmin: false,
        isStaff: false,
      };
    }

    const hasAccess = requiredRoles.includes(user.role as Role);
    const isAdmin = user.role === Role.Admin;
    const isStaff = user.role === Role.Staff;

    return {
      hasAccess,
      userRole: user.role,
      requiredRoles,
      isAdmin,
      isStaff,
    };
  }, [user, requiredRoles]);

  return permission;
};

/**
 * Hook để kiểm tra xem user có phải là admin không
 * @returns boolean
 */
export const useIsAdmin = () => {
  const { user } = useAuth();
  return user?.role === Role.Admin;
};

/**
 * Hook để kiểm tra xem user có phải là staff không
 * @returns boolean
 */
export const useIsStaff = () => {
  const { user } = useAuth();
  return user?.role === Role.Staff;
};
