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
 * Enum for types of rooms.
 * @enum {string}
 * @property {string} Single - A room with a single bed
 * @property {string} Double - A room with a double bed
 * @property {string} Twin - A room with two single beds
 * @property {string} Family - A room suitable for a family
 * @property {string} Suite - A luxurious suite room
 * @property {string} Dormitory - A shared room with multiple beds
 */
export enum RoomType {
  Single = "Single Room",
  Double = "Double Room",
  Twin = "Twin Room",
  Family = "Family Room",
  Suite = "Suite Room",
  Dormitory = "Dormitory Room",
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
export enum RoomSize {
  Small = "small",
  Medium = "medium",
  Large = "large",
}
