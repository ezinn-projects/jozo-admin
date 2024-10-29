/**
 * Enum for room types, defining the various configurations of rooms available.
 *
 * @enum {string}
 * @property {string} SINGLE - Single room, designed for one person, usually with a single bed.
 * @property {string} DOUBLE - Double room, suitable for two people, typically with a double bed.
 * @property {string} TRIPLE - Triple room, accommodates three people, often with three single beds or a combination.
 * @property {string} QUEEN - Queen room, featuring a queen-size bed, suitable for two people.
 * @property {string} KING - King room, with a king-size bed, offering a spacious option for two people.
 * @property {string} TWIN - Twin room, with two single beds, ideal for two individuals.
 */
export enum RoomType {
  SINGLE = "SINGLE",
  DOUBLE = "DOUBLE",
  TRIPLE = "TRIPLE",
  QUEEN = "QUEEN",
  KING = "KING",
  TWIN = "TWIN",
}

/**
 * Enum for room statuses in the Ezinn system.
 * Includes statuses: Available, Booked, Needs Cleaning, and Preparing.
 * @enum {string}
 */
export enum RoomStatus {
  AVAILABLE = "Available",
  BOOKED = "Booked",
  NEEDS_CLEANING = "Needs Cleaning",
  PREPARING = "Preparing",
}
