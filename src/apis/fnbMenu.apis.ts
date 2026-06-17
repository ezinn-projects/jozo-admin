import { FnbMenu } from "@/@types/FnBMenu";
import { FnBMenuItem } from "@/hooks/use-menu-items";
import http from "@/utils/http";
// import { FnbMenu } from '../types/fnbMenu.types';

export interface FnBMenuItemCleanupOrphan {
  _id: string;
  name: string;
  parentId: string;
}

export interface FnBMenuItemCleanupNormalized {
  _id: string;
  name: string;
}

export interface FnBMenuItemCleanupRemovedFields {
  _id: string;
  name: string;
  fields: string[];
}

export interface FnBMenuItemCleanupResult {
  dryRun: boolean;
  deletedOrphans: FnBMenuItemCleanupOrphan[];
  normalizedParentIds: FnBMenuItemCleanupNormalized[];
  removedExtraFields: FnBMenuItemCleanupRemovedFields[];
}

const fnbMenuApis = {
  createMenu: (menu: Omit<FnbMenu, "_id">) =>
    http.postForm<FnbMenu>("/fnb-menu", menu, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  getMenuById: (id: string) => http.get<FnbMenu | null>(`/fnb-menu/${id}`),

  getAllMenus: () => http.get<HTTPResponse<FnbMenu[]>>(`/fnb-menu`),

  deleteMenu: (id: string) => http.delete<FnbMenu | null>(`/fnb-menu/${id}`),

  updateMenu: (id: string, menu: Partial<FnbMenu>) =>
    http.putForm<FnbMenu | null>(`/fnb-menu/${id}`, menu, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  // Menu Item APIs
  createMenuItem: (menuItem: FormData) =>
    http.postForm<FnBMenuItem>("/fnb-menu-item", menuItem, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  getMenuItemById: (id: string) =>
    http.get<HTTPResponse<FnBMenuItem | null>>(`/fnb-menu-item/${id}`),

  getAllMenuItems: () =>
    http.get<HTTPResponse<FnBMenuItem[]>>(`/fnb-menu-item`),

  deleteMenuItem: (id: string) =>
    http.delete<FnBMenuItem | null>(`/fnb-menu-item/${id}`),

  updateMenuItem: (id: string, menuItem: FormData) =>
    http.putForm<FnBMenuItem | null>(`/fnb-menu-item/${id}`, menuItem, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  cleanupMenuItems: (dryRun: boolean) =>
    http.post<HTTPResponse<FnBMenuItemCleanupResult>>(
      "/fnb-menu-item/cleanup",
      { dryRun },
    ),
};

export default fnbMenuApis;
