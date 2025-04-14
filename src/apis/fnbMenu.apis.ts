import { FnbMenu } from "@/@types/FnBMenu";
import http from "@/utils/http";
// import { FnbMenu } from '../types/fnbMenu.types';

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
};

export default fnbMenuApis;
