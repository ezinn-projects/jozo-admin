const PATHS = {
  HOME: "/",
  // rooms management
  ROOMS: "/rooms",
  NEW_ROOM: "/rooms/new",
  EDIT_ROOM: "/rooms/:id/edit",

  // user managemen
  SETTINGS: "/settings",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  STAFF: "/staff",
  ADMIN: "/admin",
  UNAUTHORIZED: "/unauthorized",
  NOT_FOUND: "/not-found",
  PRICE: "/price",
  CALENDAR: "/calendar",

  // room types management
  ROOM_TYPES_LISTS: "/room-types",
  ROOM_TYPES_NEW: "/room-types/new",
  ROOM_TYPES_EDIT: "/room-types/:id/edit",

  // fnb management
  FNB: "/fnb",
  FNB_NEW: "/fnb/new",
  FNB_EDIT: "/fnb/:id/edit",
  MENU_ITEMS: "/menu-items",
  MENU_ITEMS_NEW: "/menu-items/new",
  MENU_ITEMS_EDIT: "/menu-items/:id/edit",

  // promotion management
  PROMOTION: "/promotion",
  PROMOTION_NEW: "/promotion/new",
  PROMOTION_EDIT: "/promotion/:id/edit",

  // total revenue
  TOTAL_REVENUE: "/total-revenue",
} as const;

export default PATHS;
