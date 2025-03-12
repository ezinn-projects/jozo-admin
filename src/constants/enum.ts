/**
 * Enum for user roles.
 * @enum {string}
 * @property {string} Admin - Administrator with full access
 * @property {string} Staff - Staff member with limited access
 */
export enum Role {
  Admin = "admin",
  Staff = "staff",
}

/**
 * Enum for types of day.
 * @enum {string}
 * @property {string} Weekday - A weekday
 * @property {string} Weekend - A weekend
 * @property {string} Holiday - A holiday
 */
export enum DayType {
  Weekday = "weekday",
  Weekend = "weekend",
  Holiday = "holiday",
}

/**
 * Enum for types of room size.
 * @enum {string}
 * @property {string} Small - A small room
 * @property {string} Medium - A medium room
 * @property {string} Large - A large room
 */
export enum RoomType {
  Small = "small",
  Medium = "medium",
  Large = "large",
}

/**
 * Enum for types of room status.
 * @enum {string}
 * @property {string} Available - A room is available
 * @property {string} InUse - A room is in use
 * @property {string} Booked - A room is booked
 * @property {string} Maintenance - A room is in maintenance
 * @property {string} Locked - A room is locked
 * @property {string} Cancelled - A room is cancelled
 */
export enum RoomStatus {
  Available = "available",
  InUse = "in use",
  Booked = "booked",
  Maintenance = "maintenance",
  Locked = "locked",
  Cancelled = "cancelled",
}
