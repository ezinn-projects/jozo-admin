// import { RoomType } from './Type';

import { RoomStatus, RoomType } from "./enum";

/**
 * Options for RoomType with short, descriptive labels.
 */
const roomTypeOptions = [
  { value: RoomType.SINGLE, label: "Single Room" },
  { value: RoomType.DOUBLE, label: "Double Room" },
  { value: RoomType.TRIPLE, label: "Triple Room" },
  { value: RoomType.QUEEN, label: "Queen Room" },
  { value: RoomType.KING, label: "King Room" },
  { value: RoomType.TWIN, label: "Twin Room" },
];

/**
 * Using RoomStatus enum in system options
 */
const roomStatusOptions = [
  { label: "Available", value: RoomStatus.AVAILABLE },
  { label: "Booked", value: RoomStatus.BOOKED },
  { label: "Needs Cleaning", value: RoomStatus.NEEDS_CLEANING },
  { label: "Preparing", value: RoomStatus.PREPARING },
];

export { roomTypeOptions, roomStatusOptions };
