import { useMemo } from "react";
import { MENU_ITEMS, MenuItem } from "@/constants/menuItems";
import useAuth from "./useAuth";

/**
 * Hook để lọc menu items dựa trên role của user
 * @returns Menu items đã được lọc theo quyền của user
 */
export const useMenuItems = (): MenuItem[] => {
  const { user } = useAuth();

  const filteredMenuItems = useMemo(() => {
    if (!user) {
      return [];
    }

    return MENU_ITEMS.filter((item) => {
      // Kiểm tra xem item có thuộc tính roles không
      if (!item.roles) {
        return true; // Nếu không có roles, cho phép tất cả
      }

      // Kiểm tra xem role của user có trong danh sách roles được phép không
      const hasAccess = item.roles.includes(user.role);

      // Nếu item có subItems, cũng cần lọc subItems
      if (item.subItems && item.subItems.length > 0) {
        const filteredSubItems = item.subItems.filter((subItem) => {
          if (!subItem.roles) {
            return true;
          }
          return subItem.roles.includes(user.role);
        });

        // Chỉ hiển thị item nếu có ít nhất một subItem được phép truy cập
        return hasAccess && filteredSubItems.length > 0;
      }

      return hasAccess;
    }).map((item) => {
      // Nếu item có subItems, lọc subItems theo role
      if (item.subItems && item.subItems.length > 0) {
        return {
          ...item,
          subItems: item.subItems.filter((subItem) => {
            if (!subItem.roles) {
              return true;
            }
            return subItem.roles.includes(user.role);
          }),
        };
      }
      return item;
    });
  }, [user]);

  return filteredMenuItems;
};
