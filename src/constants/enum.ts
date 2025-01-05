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
