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
  CHANGE_PASSWORD: "/change-password",
  PROFILE: "/profile",
  STAFF: "/staff",
  ADMIN: "/admin",
  UNAUTHORIZED: "/unauthorized",
  NOT_FOUND: "/not-found",
  PRICE: "/price",
  CALENDAR: "/calendar",

  // users management
  USERS_MANAGEMENT: "/users-management",
  USERS_MANAGEMENT_NEW: "/users-management/new",
  USERS_MANAGEMENT_EDIT: "/users-management/:id/edit",

  // staff management
  STAFF_MANAGEMENT: "/staff-management",
  STAFF_MANAGEMENT_NEW: "/staff-management/new",
  STAFF_MANAGEMENT_EDIT: "/staff-management/:id/edit",

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

  // recruitment management
  RECRUITMENT: "/recruitment",

  // gifts management
  GIFTS: "/gifts",

  // staff schedule management
  STAFF_SCHEDULE: "/staff-schedule",
  STAFF_EARNINGS_DETAIL: "/staff-schedule/:userId/earnings",

  // my schedule - employee view their own schedules
  MY_SCHEDULE: "/my-schedule",
  MY_EARNINGS_DETAIL: "/my-schedule/earnings",

  // notifications
  NOTIFICATIONS: "/notifications",

  // total revenue
  TOTAL_REVENUE: "/total-revenue",
} as const;

export default PATHS;
