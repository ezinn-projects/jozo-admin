import { IRoom, IRoomSchedule } from "@/@types/Room";
import { RoomStatus, RoomType } from "@/constants/enum";

export const getEffectiveScheduleRoomType = (
  schedule: Pick<IRoomSchedule, "roomType">,
  room?: Pick<IRoom, "roomType"> | null,
): RoomType | undefined => schedule.roomType ?? room?.roomType;

export const isScheduleRoomTypeEditable = (
  schedule: Pick<IRoomSchedule, "status" | "actualEndTime">,
): boolean =>
  schedule.status !== RoomStatus.Finished &&
  schedule.status !== RoomStatus.Cancelled &&
  !schedule.actualEndTime;

export const getRoomTypeLabel = (type?: RoomType) => {
  switch (type) {
    case RoomType.Small:
      return "Nhỏ";
    case RoomType.Large:
      return "Lớn";
    case RoomType.Medium:
      return "Nhỏ";
    case RoomType.Dorm:
      return "Dorm";
    default:
      return "—";
  }
};

export const getRoomTypeForBooking = (
  use4Mic: boolean,
): RoomType.Medium | RoomType.Large =>
  use4Mic ? RoomType.Large : RoomType.Medium;
