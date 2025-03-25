import React, { useEffect, useRef, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { IRoom, IRoomSchedule } from "@/@types/Room";
import roomApis from "@/apis/room.apis";
import { useRoomSchedules } from "@/hooks/room-schedule";
import ScheduleModal from "@/components/modules/RoomSchedule/ScheduleModal";
import ProcessLockedModal from "./ProcessLockedModal";
import ProcessBookedModal from "./ProcessBookedModal";
import ExtendSessionModal from "./ExtendSessionModal";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, CircleXIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import ProcessInUseModal from "./ProcessInUseModal";

const DAY_START_HOUR = 10;
const DAY_END_HOUR = 24;
const HOUR_MARKER_SPACING = 120;
const SCALE = HOUR_MARKER_SPACING / 60;
const TIMELINE_WIDTH =
  HOUR_MARKER_SPACING * (DAY_END_HOUR - DAY_START_HOUR) + 300;

interface GroupedSchedules {
  [roomId: string]: IRoomSchedule[];
}

const groupSchedulesByRoom = (schedules: IRoomSchedule[]): GroupedSchedules =>
  schedules.reduce((acc: GroupedSchedules, schedule) => {
    if (!acc[schedule.roomId]) {
      acc[schedule.roomId] = [];
    }
    acc[schedule.roomId].push(schedule);
    return acc;
  }, {});

type Modal =
  | "create"
  | "edit"
  | "delete"
  | "process"
  | "booked"
  | "inUse"
  | "extend"
  | "foodDrink"
  | "bill"
  | null;

const RoomTimelineTable: React.FC = () => {
  const [date, setDate] = useState<Dayjs>(dayjs());
  const { data: schedules, isLoading, error, refetch } = useRoomSchedules(date);
  const {
    data: roomsData,
    isLoading: loadingRooms,
    error: roomError,
  } = useQuery({
    queryKey: ["rooms"],
    queryFn: roomApis.getRooms,
    select: (data) => data.data.result as IRoom[],
  });

  const [modal, setModal] = useState<Modal>(null);
  const [selectedRoom, setSelectedRoom] = useState<IRoom | null>(null);
  const [lockedSchedule, setLockedSchedule] = useState<IRoomSchedule | null>(
    null
  );
  const [bookedSchedule, setBookedSchedule] = useState<IRoomSchedule | null>(
    null
  );
  const [inUseSchedule, setInUseSchedule] = useState<IRoomSchedule | null>(
    null
  );

  // Cập nhật currentTime mỗi giây
  const [currentTime, setCurrentTime] = useState(dayjs());
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Ref cho timeline container
  const timelineContainerRef = useRef<HTMLDivElement>(null);

  // State điều khiển auto-scroll
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handler để tạm dừng auto-scroll khi người dùng scroll
  const handleScroll = () => {
    setAutoScrollEnabled(false);
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      setAutoScrollEnabled(true);
    }, 5000); // 5 giây không có thao tác thì bật lại auto-scroll
  };

  // Cleanup timer khi unmount
  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  // --- TÍNH TOÁN NOW MARKER ---
  const isToday = date.isSame(currentTime, "day");
  let markerLeft = 0;
  const leftOffset = 240;
  if (isToday) {
    const totalMinutes =
      (currentTime.hour() - DAY_START_HOUR) * 60 + currentTime.minute();
    const clampedMinutes = Math.min(
      Math.max(totalMinutes, 0),
      (DAY_END_HOUR - DAY_START_HOUR) * 60
    );
    markerLeft = leftOffset + clampedMinutes * SCALE;
  }

  // Auto-scroll effect: chỉ cuộn nếu now marker không nằm trong viewport
  useEffect(() => {
    if (timelineContainerRef.current && isToday && autoScrollEnabled) {
      const container = timelineContainerRef.current;
      const offset = 100; // offset để marker không nằm sát bên trái
      const currentScrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;

      // Nếu marker nằm bên trái hoặc bên phải của vùng hiển thị với khoảng cách offset thì mới cuộn
      if (
        markerLeft < currentScrollLeft + offset ||
        markerLeft > currentScrollLeft + containerWidth - offset
      ) {
        container.scrollLeft = markerLeft - offset;
      }
    }
  }, [currentTime, markerLeft, isToday, autoScrollEnabled]);

  if (isLoading || loadingRooms) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (roomError) return <div>Error: {roomError.message}</div>;

  const grouped = groupSchedulesByRoom(schedules || []);

  const handleRoomClick = (roomId: string) => {
    const foundRoom = roomsData?.find((room) => room._id === roomId);
    if (foundRoom) {
      setSelectedRoom(foundRoom);
      setModal("create");
    }
  };

  const closeModal = () => {
    setModal(null);
    setSelectedRoom(null);
    setLockedSchedule(null);
    setBookedSchedule(null);
    setInUseSchedule(null);
  };

  // Hàm tính toán vị trí và chiều rộng của một event block
  const getMarkerStyle = (schedule: IRoomSchedule) => {
    const eventStart = dayjs(schedule.startTime);
    const dayStart = eventStart.startOf("day").hour(DAY_START_HOUR).minute(0);
    let offsetMinutes = eventStart.diff(dayStart, "minute");
    if (offsetMinutes < 0) offsetMinutes = 0;

    let durationMinutes = 0;
    const status = schedule.status.toLowerCase();
    if (status === "booked") {
      durationMinutes = schedule.endTime
        ? dayjs(schedule.endTime).diff(eventStart, "minute")
        : 120;
    } else if (status === "locked") {
      durationMinutes = schedule.endTime
        ? dayjs(schedule.endTime).diff(eventStart, "minute")
        : 5;
    } else if (status === "maintenance") {
      durationMinutes = schedule.endTime
        ? dayjs(schedule.endTime).diff(eventStart, "minute")
        : 240;
    } else if (status === "in use") {
      if (schedule.endTime) {
        const eventEnd = dayjs(schedule.endTime);
        durationMinutes = eventEnd.diff(eventStart, "minute");
      } else {
        durationMinutes = currentTime.diff(eventStart, "minute");
        if (durationMinutes <= 0) durationMinutes = 1;
      }
    }

    const left = offsetMinutes * SCALE;
    let width = durationMinutes * SCALE;
    if (left + width > TIMELINE_WIDTH) {
      width = TIMELINE_WIDTH - left;
    }

    let bgColor = "";
    if (status === "booked") {
      bgColor = "bg-blue-500";
    } else if (status === "locked") {
      bgColor = "bg-orange-500";
    } else if (status === "in use") {
      if (schedule.endTime && dayjs(schedule.endTime).isAfter(currentTime)) {
        bgColor = "bg-green-300";
      } else {
        bgColor = "bg-green-500";
      }
    } else if (status === "maintenance") {
      bgColor = "bg-gray-500";
    } else {
      bgColor = "bg-gray-300";
    }

    // Nếu sự kiện đã hoàn toàn nằm bên trái now marker (đã qua) thì thay đổi màu thành sắc đậm hơn
    if (isToday && markerLeft >= left + width) {
      if (status === "booked") {
        bgColor = "bg-blue-700";
      } else if (status === "locked") {
        bgColor = "bg-orange-700";
      } else if (status === "in use") {
        bgColor = "bg-green-700";
      } else if (status === "maintenance") {
        bgColor = "bg-gray-700";
      } else {
        bgColor = "bg-gray-500";
      }
    }

    return { left, width, bgColor };
  };

  return (
    <div className="container mx-auto p-4 w-full">
      {/* Header: Chọn ngày */}
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-2xl font-bold">Room Schedules Timeline</h1>
        <Popover modal={true}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[240px] pl-3 text-left font-normal"
            >
              {date ? date.format("DD/MM/YYYY") : "Pick a date"}
              {date ? (
                <CircleXIcon
                  className="ml-auto h-4 w-4 opacity-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDate(dayjs());
                  }}
                />
              ) : (
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={date?.toDate()}
              onSelect={(newDate) => newDate && setDate(dayjs(newDate))}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Container cho phép scroll ngang, thêm onScroll để bắt sự kiện scroll */}
      <div
        className="overflow-x-auto"
        ref={timelineContainerRef}
        onScroll={handleScroll}
      >
        {/* Timeline container */}
        <div className="relative" style={{ width: `${TIMELINE_WIDTH}px` }}>
          {/* Timeline Header */}
          <div
            className="flex border-b bg-gray-200 w-full"
            style={{ position: "sticky", top: 0, zIndex: 20 }}
          >
            <div className="w-[240px] p-2 border-r flex items-center justify-center font-medium bg-gray-200">
              Phòng
            </div>
            <div className="flex-1 relative h-10">
              {Array.from({
                length: (DAY_END_HOUR - DAY_START_HOUR) * 2 + 1,
              }).map((_, index) => {
                const left = index * (HOUR_MARKER_SPACING / 2);
                return (
                  <div
                    key={`grid-${index}`}
                    className={`absolute h-full w-px ${
                      index % 2 === 0 ? "bg-gray-300" : "bg-gray-200"
                    }`}
                    style={{ left }}
                  />
                );
              })}
              {Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }).map(
                (_, index) => {
                  const hour = DAY_START_HOUR + index;
                  const left = index * HOUR_MARKER_SPACING;
                  return (
                    <div
                      key={`header-marker-${hour}`}
                      className="absolute top-1/2 -translate-y-1/2 text-xs text-gray-600 text-center font-medium"
                      style={{ left, width: 20 }}
                    >
                      {hour}:00
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Now Marker (line đỏ) */}
          {isToday && markerLeft >= 0 && markerLeft <= TIMELINE_WIDTH && (
            <>
              <div
                className="absolute z-20"
                style={{
                  left: markerLeft - 18,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              >
                <div className="text-xs text-red-500 bg-white px-1 rounded">
                  {currentTime.format("HH:mm")}
                </div>
              </div>
              <div
                className="absolute bg-red-500 w-px"
                style={{ left: markerLeft, top: 0, bottom: 0, zIndex: 10 }}
              />
            </>
          )}

          {/* Danh sách phòng */}
          {roomsData?.map((room) => {
            const roomSchedules = grouped[room._id] || [];
            return (
              <div
                key={room._id}
                className="flex border-b hover:bg-gray-50 w-full"
              >
                <div className="w-[240px] p-2 border-r flex items-center justify-center sticky left-0 z-10 bg-white">
                  <button
                    onClick={() => handleRoomClick(room._id)}
                    className="text-blue-600 hover:underline"
                  >
                    {room.roomName}
                  </button>
                </div>
                <div className="flex-1 h-12 relative">
                  {isToday && (
                    <>
                      {/* Overlay cho vùng đã qua (màu đậm hơn) */}
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: markerLeft,
                          height: "100%",
                          pointerEvents: "none",
                          zIndex: 0,
                        }}
                      ></div>
                    </>
                  )}
                  {Array.from({
                    length: (DAY_END_HOUR - DAY_START_HOUR) * 2 + 1,
                  }).map((_, index) => {
                    const left = index * (HOUR_MARKER_SPACING / 2);
                    return (
                      <div
                        key={`room-grid-${index}`}
                        className={`absolute h-full w-px ${
                          index % 2 === 0 ? "bg-gray-200" : "bg-gray-100"
                        }`}
                        style={{ left }}
                      />
                    );
                  })}
                  {roomSchedules?.map((schedule) => {
                    const { left, width, bgColor } = getMarkerStyle(schedule);
                    const eventElement = (
                      <div
                        key={schedule._id}
                        className={`absolute top-0 bottom-0 my-2 ${bgColor} opacity-75 rounded shadow-sm hover:opacity-100 transition-opacity cursor-pointer`}
                        style={{ left, width }}
                        title={`${schedule.status} - ${dayjs(
                          schedule.startTime
                        ).format("HH:mm")}`}
                        onClick={() => {
                          const lowerStatus = schedule.status.toLowerCase();
                          if (lowerStatus === "locked") {
                            setLockedSchedule(schedule);
                            setModal("process");
                          } else if (lowerStatus === "booked") {
                            setBookedSchedule(schedule);
                            setModal("booked");
                          } else if (lowerStatus === "in use") {
                            setInUseSchedule(schedule);
                            setModal("inUse");
                          }
                        }}
                      ></div>
                    );
                    if (schedule.status.toLowerCase() === "booked") {
                      const eventStart = dayjs(schedule.startTime);
                      const eventEnd = schedule.endTime
                        ? dayjs(schedule.endTime)
                        : eventStart.add(120, "minute");
                      return (
                        <Tooltip key={schedule._id}>
                          <TooltipTrigger asChild>
                            {eventElement}
                          </TooltipTrigger>
                          <TooltipContent>
                            Start: {eventStart.format("HH:mm")} - End:{" "}
                            {eventEnd.format("HH:mm")}
                          </TooltipContent>
                        </Tooltip>
                      );
                    } else if (schedule.status.toLowerCase() === "locked") {
                      const lockedDuration = dayjs().diff(
                        dayjs(schedule.startTime),
                        "minute"
                      );
                      return (
                        <Tooltip key={schedule._id}>
                          <TooltipTrigger asChild>
                            {eventElement}
                          </TooltipTrigger>
                          <TooltipContent>
                            Locked for {lockedDuration} minute
                            {lockedDuration !== 1 && "s"}
                          </TooltipContent>
                        </Tooltip>
                      );
                    } else if (schedule.status.toLowerCase() === "in use") {
                      const inUseDuration = dayjs().diff(
                        dayjs(schedule.startTime),
                        "minute"
                      );
                      let durationLabel = "";
                      if (inUseDuration < 60) {
                        durationLabel = `In use for ${inUseDuration} minute${
                          inUseDuration !== 1 ? "s" : ""
                        }`;
                      } else {
                        const hours = Math.floor(inUseDuration / 60);
                        const minutes = inUseDuration % 60;
                        durationLabel = `In use for ${hours} hour${
                          hours !== 1 ? "s" : ""
                        }${
                          minutes > 0
                            ? ` ${minutes} minute${minutes !== 1 ? "s" : ""}`
                            : ""
                        }`;
                      }
                      return (
                        <Tooltip key={schedule._id}>
                          <TooltipTrigger asChild>
                            {eventElement}
                          </TooltipTrigger>
                          <TooltipContent>{durationLabel}</TooltipContent>
                        </Tooltip>
                      );
                    }
                    return eventElement;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Các modal khác */}
      {modal === "create" && selectedRoom && (
        <ScheduleModal
          isOpen={true}
          onClose={closeModal}
          refetchSchedules={refetch}
          room={selectedRoom}
          selectedDate={date.toDate()}
        />
      )}
      {modal === "process" && lockedSchedule && (
        <ProcessLockedModal
          isOpen={true}
          onClose={closeModal}
          refetchSchedules={refetch}
          schedule={lockedSchedule}
        />
      )}
      {modal === "booked" && bookedSchedule && (
        <ProcessBookedModal
          isOpen={true}
          onClose={closeModal}
          schedule={bookedSchedule}
          refetchSchedules={refetch}
        />
      )}
      {modal === "inUse" && inUseSchedule && (
        <ProcessInUseModal
          isOpen={true}
          onClose={closeModal}
          schedule={inUseSchedule}
          refetchSchedules={refetch}
          onExtendSession={() => setModal("extend")}
        />
      )}
      {modal === "extend" && inUseSchedule && (
        <ExtendSessionModal
          isOpen={true}
          onClose={closeModal}
          schedule={inUseSchedule}
          refetchSchedules={refetch}
        />
      )}
    </div>
  );
};

export default RoomTimelineTable;
