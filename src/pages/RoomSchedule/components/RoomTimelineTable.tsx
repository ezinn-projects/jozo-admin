import { IRoom, IRoomSchedule } from "@/@types/Room";
import roomApis from "@/apis/room.apis";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRoomSchedules } from "@/hooks/room-schedule";
import { useQuery } from "@tanstack/react-query";
import dayjs, { Dayjs } from "dayjs";
import { CalendarIcon, CircleXIcon } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

const DAY_START_HOUR = 10;
const DAY_END_HOUR = 24;
const TOTAL_MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60;

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

const RoomTimelineTable: React.FC = () => {
  const [date, setDate] = useState<Dayjs>(dayjs());
  const { data: schedules, isLoading, error } = useRoomSchedules(date);
  const {
    data: roomsData,
    isLoading: loadingRooms,
    error: roomError,
  } = useQuery({
    queryKey: ["rooms"],
    queryFn: roomApis.getRooms,
    select: (data) => data.data.result as IRoom[],
  });

  const timelineHeaderRef = useRef<HTMLDivElement>(null);
  const [timelineWidth, setTimelineWidth] = useState<number>(1000);

  useEffect(() => {
    if (timelineHeaderRef.current) {
      setTimelineWidth(timelineHeaderRef.current.clientWidth);
    }
  }, []);

  if (isLoading || loadingRooms) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (roomError) return <div>Error: {roomError.message}</div>;

  const grouped = groupSchedulesByRoom(schedules || []);
  const scale = timelineWidth / TOTAL_MINUTES;

  const handleRoomClick = (roomId: string) => {
    // TODO: Implement room details modal
    console.log("Room clicked:", roomId);
  };

  const getMarkerStyle = (schedule: IRoomSchedule) => {
    const eventStart = dayjs(schedule.startTime);
    const dayStart = eventStart.startOf("day").hour(DAY_START_HOUR).minute(0);
    let offsetMinutes = eventStart.diff(dayStart, "minute");
    if (offsetMinutes < 0) offsetMinutes = 0;

    let durationMinutes = 0;
    const status = schedule.status.toLowerCase();
    if (status === "booked") {
      durationMinutes = 120;
    } else if (status === "locked") {
      durationMinutes = 5;
    } else if (status === "maintenance") {
      durationMinutes = 240;
    } else if (status === "in use") {
      if (schedule.endTime) {
        durationMinutes = dayjs(schedule.endTime).diff(eventStart, "minute");
      } else {
        durationMinutes = 30;
      }
    }

    const left = offsetMinutes * scale;
    let width = durationMinutes * scale;
    if (left + width > timelineWidth) {
      width = timelineWidth - left;
    }

    let bgColor = "";
    if (status === "booked") {
      bgColor = "bg-blue-500";
    } else if (status === "locked") {
      bgColor = "bg-orange-500";
    } else if (status === "in use") {
      bgColor = "bg-green-500";
    } else if (status === "maintenance") {
      bgColor = "bg-gray-500";
    } else {
      bgColor = "bg-gray-300";
    }
    return { left, width, bgColor };
  };

  return (
    <div className="container mx-auto p-4 w-full">
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

      <div className="w-full">
        <div className="flex border-b bg-gray-200">
          <div className="w-40 p-2 border-r flex items-center justify-center font-medium">
            Phòng
          </div>
          <div className="flex-1 relative h-10" ref={timelineHeaderRef}>
            {/* Grid lines */}
            {Array.from({ length: (DAY_END_HOUR - DAY_START_HOUR) * 2 }).map(
              (_, index) => {
                const left = index * 30 * scale; // Every 30 minutes
                return (
                  <div
                    key={`grid-${index}`}
                    className={`absolute h-full w-px bg-gray-200 ${
                      index % 2 === 0 ? "bg-gray-300" : ""
                    }`}
                    style={{ left }}
                  />
                );
              }
            )}
            {/* Time markers */}
            {Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }).map(
              (_, index) => {
                const hour = DAY_START_HOUR + index;
                const left = (hour - DAY_START_HOUR) * 60 * scale;
                return (
                  <div
                    key={`header-marker-${hour}`}
                    className="absolute top-1/2 -translate-y-1/2 text-xs text-gray-600 text-center font-medium"
                    style={{ left: left - 10, width: 20 }}
                  >
                    {hour}:00
                  </div>
                );
              }
            )}
          </div>
        </div>

        {roomsData?.map((room) => {
          const roomSchedules = grouped[room._id] || [];
          return (
            <div
              key={room._id}
              className="flex border-b hover:bg-gray-50"
              style={{ width: "100%" }}
            >
              <div className="w-40 p-2 border-r flex items-center justify-center">
                <button
                  onClick={() => handleRoomClick(room._id)}
                  className="text-blue-600 hover:underline"
                >
                  {room.roomName}
                </button>
              </div>
              <div className="flex-1 h-12 relative">
                {/* Grid lines */}
                {Array.from({
                  length: (DAY_END_HOUR - DAY_START_HOUR) * 2,
                }).map((_, index) => {
                  const left = index * 30 * scale; // Every 30 minutes
                  return (
                    <div
                      key={`grid-${index}`}
                      className={`absolute h-full w-px bg-gray-100 ${
                        index % 2 === 0 ? "bg-gray-200" : ""
                      }`}
                      style={{ left }}
                    />
                  );
                })}
                {/* Schedule blocks */}
                {roomSchedules.map((schedule) => {
                  const { left, width, bgColor } = getMarkerStyle(schedule);
                  return (
                    <div
                      key={schedule._id}
                      className={`absolute top-0 bottom-0 my-2 ${bgColor} opacity-75 rounded shadow-sm hover:opacity-100 transition-opacity cursor-pointer`}
                      style={{ left, width }}
                      title={`${schedule.status} - ${dayjs(
                        schedule.startTime
                      ).format("HH:mm")}`}
                    ></div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoomTimelineTable;
