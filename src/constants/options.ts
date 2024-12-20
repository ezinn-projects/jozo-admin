import { DayType, RoomSize } from "./enum";

export const ROOM_SIZE_OPTIONS = [
  { value: RoomSize.Small, label: "Small" },
  { value: RoomSize.Medium, label: "Medium" },
  { value: RoomSize.Large, label: "Large" },
];

export const DAY_TYPE_OPTIONS = [
  { value: DayType.Weekday, label: "Weekday" },
  { value: DayType.Weekend, label: "Weekend" },
  { value: DayType.Holiday, label: "Holiday" },
];
