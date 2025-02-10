// import { RoomType } from './Type';

import { RoomStatus, RoomType } from "./enum";

/**
 * Options for RoomType with short, descriptive labels.
 */
const roomTypeOptions = [
  { value: RoomType.LARGE, label: "Large Room" },
  { value: RoomType.MEDIUM, label: "Medium Room" },
  { value: RoomType.SMALL, label: "Small Room" },
];

/**
 * Using RoomStatus enum in system options
 */
const roomStatusOptions = [
  { label: "Available", value: RoomStatus.Available },
  { label: "Occupied", value: RoomStatus.Occupied },
  { label: "Cleaning", value: RoomStatus.Cleaning },
  { label: "Reserved", value: RoomStatus.Reserved },
  { label: "Maintenance", value: RoomStatus.Maintenance },
];

export { roomTypeOptions, roomStatusOptions };
