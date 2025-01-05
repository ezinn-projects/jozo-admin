import { DayType, RoomType } from "./enum";

export const ROOM_SIZE_OPTIONS = [
  { value: RoomType.Small, label: "Small" },
  { value: RoomType.Medium, label: "Medium" },
  { value: RoomType.Large, label: "Large" },
];

export const DAY_TYPE_OPTIONS = [
  { value: DayType.Weekday, label: "Weekday" },
  { value: DayType.Weekend, label: "Weekend" },
  { value: DayType.Holiday, label: "Holiday" },
];
