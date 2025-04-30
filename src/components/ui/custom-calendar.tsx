import dayjs from "dayjs";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Input } from "./input";
import { Label } from "./label";
import { Textarea } from "./textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";

interface Event {
  _id?: string;
  date: string;
  name: string;
  description?: string;
}

interface CustomCalendarProps {
  events?: Event[];
  onEventAdd?: (event: Event) => void;
  onEventDelete?: (event: Event) => void;
}

export function CustomCalendar({
  events = [],
  onEventAdd,
  onEventDelete,
}: CustomCalendarProps) {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({});

  // Generate calendar grid
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = currentDate.startOf("month");
    const lastDayOfMonth = currentDate.endOf("month");
    const firstDayOfWeek = firstDayOfMonth.day();
    const daysInMonth = lastDayOfMonth.date();
    const daysInPrevMonth = firstDayOfMonth.subtract(1, "month").daysInMonth();

    const grid = [];
    let dayCount = 1;
    let nextMonthDayCount = 1;

    // Generate 6 weeks of calendar
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        if (week === 0 && day < firstDayOfWeek) {
          // Days from previous month
          weekDays.push({
            date: dayjs(currentDate)
              .subtract(1, "month")
              .date(daysInPrevMonth - firstDayOfWeek + day + 1),
            isCurrentMonth: false,
          });
        } else if (dayCount > daysInMonth) {
          // Days from next month
          weekDays.push({
            date: dayjs(currentDate).add(1, "month").date(nextMonthDayCount),
            isCurrentMonth: false,
          });
          nextMonthDayCount++;
        } else {
          // Days from current month
          weekDays.push({
            date: dayjs(currentDate).date(dayCount),
            isCurrentMonth: true,
          });
          dayCount++;
        }
      }
      grid.push(weekDays);
    }
    return grid;
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(currentDate.subtract(1, "month"));
  };

  const handleNextMonth = () => {
    setCurrentDate(currentDate.add(1, "month"));
  };

  const handleToday = () => {
    setCurrentDate(dayjs());
  };

  const handleDateClick = (date: dayjs.Dayjs) => {
    setSelectedDate(date);
    setNewEvent({ date: date.format("YYYY-MM-DD") });
    setIsAddEventOpen(true);
  };

  const handleAddEvent = () => {
    if (newEvent.date && newEvent.name) {
      onEventAdd?.(newEvent as Event);
      setIsAddEventOpen(false);
      setNewEvent({});
    }
  };

  const handleDeleteClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    setEventToDelete(event);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (eventToDelete) {
      onEventDelete?.(eventToDelete);
      setIsDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };

  const getEventForDate = (date: dayjs.Dayjs) => {
    // Ensure events is an array
    console.log("events", events);
    const eventsArray = Array.isArray(events) ? events : [];
    console.log(
      'eventsArray.find((event) => dayjs(event.date).isSame(date, "day"));',
      eventsArray.find((event) => dayjs(event.date).isSame(date, "day"))
    );
    return eventsArray.find((event) => dayjs(event.date).isSame(date, "day"));
  };

  return (
    <div className="w-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>
            Today
          </Button>
          <h2 className="text-xl font-semibold">
            {currentDate.format("MMMM YYYY")}
          </h2>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsAddEventOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {/* Weekday Headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="bg-white p-2 text-center font-medium">
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarGrid.map((week, weekIndex) =>
          week.map((day, dayIndex) => {
            const event = getEventForDate(day.date);
            const isToday = day.date.isSame(dayjs(), "day");
            const isSelected = selectedDate?.isSame(day.date, "day");

            return (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={`min-h-[120px] bg-white p-2 relative ${
                  !day.isCurrentMonth ? "text-gray-400" : ""
                } ${isToday ? "bg-blue-50" : ""} ${
                  isSelected ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => handleDateClick(day.date)}
              >
                <div className="font-medium">{day.date.date()}</div>
                {event && (
                  <div className="mt-1">
                    <div className="group flex items-center justify-between text-xs p-2 bg-red-100 rounded-md border-l-4 border-red-500">
                      <span className="truncate font-medium" title={event.name}>
                        {event.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 opacity-0 group-hover:opacity-100"
                        onClick={(e) => handleDeleteClick(event, e)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    {event.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Event Dialog */}
      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Event Name</Label>
              <Input
                value={newEvent.name || ""}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, name: e.target.value })
                }
                placeholder="Enter event name"
              />
            </div>
            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                value={newEvent.description || ""}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, description: e.target.value })
                }
                placeholder="Enter event description"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddEventOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddEvent}>Add Event</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
