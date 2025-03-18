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
} as const;

export default PATHS;
