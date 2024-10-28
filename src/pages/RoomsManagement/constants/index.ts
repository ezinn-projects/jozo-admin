// import { RoomType } from './Type';

import { RoomType } from "./enum";

/**
 * Options for RoomType with short, descriptive labels.
 */
export const roomTypeOptions = [
  { value: RoomType.SINGLE, label: "Single Room" },
  { value: RoomType.DOUBLE, label: "Double Room" },
  { value: RoomType.TRIPLE, label: "Triple Room" },
  { value: RoomType.QUEEN, label: "Queen Room" },
  { value: RoomType.KING, label: "King Room" },
  { value: RoomType.TWIN, label: "Twin Room" },
];
