/**
 * Enum for room types, defining the various configurations of rooms available.
 *
 * @enum {string}
 * @property {string} LARGE - Large room, suitable for two people, typically with a double bed.
 * @property {string} MEDIUM - Medium room, suitable for two people, typically with a double bed.
 * @property {string} SMALL - Small room, suitable for two people, typically with a double bed.
 */
export enum RoomType {
  LARGE = "large",
  MEDIUM = "medium",
  SMALL = "small",
}

/**
 * Enum for room statuses in the jozo system.
 * Includes statuses: Available, Booked, Needs Cleaning, and Preparing.
 * @enum {string}
 */
export enum RoomStatus {
  Available = "available",
  Occupied = "occupied",
  Cleaning = "cleaning",
  Reserved = "reserved",
  Maintenance = "maintenance",
}
