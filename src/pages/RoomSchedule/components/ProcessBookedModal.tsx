import { IRoomSchedule } from "@/@types/Room";
import roomsScheduleApis from "@/apis/roomSchedule.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RoomStatus } from "@/constants/enum";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import * as React from "react";
import MenuItemsModal from "@/components/modules/RoomSchedule/MenuItemsModal";
import { useQuery } from "@tanstack/react-query";
import fnbMenuApis from "@/apis/fnbMenu.apis";

// Import type MenuItem từ MenuItemsModal
interface MenuItem {
  _id: string;
  name: string;
  parentId: string | null;
  hasVariant: boolean;
  price: number;
  image: string;
  category: string;
  inventory: {
    quantity: number;
    minStock?: number;
    maxStock?: number;
    lastUpdated?: string;
  };
  createdAt: string;
  updatedAt: string;
  existingImage?: string;
  quantity?: string;
  variants?: string;
}

interface ProcessBookedModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: IRoomSchedule;
  refetchSchedules: VoidFunction;
}

const ProcessBookedModal: React.FC<ProcessBookedModalProps> = ({
  isOpen,
  onClose,
  schedule,
  refetchSchedules,
}) => {
  const eventStart = dayjs(schedule.startTime);
  const eventEnd = schedule.endTime
    ? dayjs(schedule.endTime)
    : eventStart.add(120, "minute");

  // State cho thời gian điều chỉnh
  const [adjustedStartTime, setAdjustedStartTime] = React.useState<string>("");
  const [adjustedEndTime, setAdjustedEndTime] = React.useState<string>("");

  // State cho modal đặt đồ ăn
  const [isMenuModalOpen, setIsMenuModalOpen] = React.useState(false);

  // Query lấy menu items
  const { data: menuItemsData } = useQuery({
    queryKey: ["menuItems"],
    queryFn: () => fnbMenuApis.getAllMenuItems(),
    enabled: isOpen,
  });

  const menuItems = (menuItemsData?.data?.result ||
    []) as unknown as MenuItem[];

  // Khởi tạo state khi schedule thay đổi
  React.useEffect(() => {
    if (schedule) {
      setAdjustedStartTime(dayjs(schedule.startTime).format("HH:mm"));
      const defaultEnd = schedule.endTime
        ? dayjs(schedule.endTime)
        : dayjs(schedule.startTime).add(120, "minute");
      setAdjustedEndTime(defaultEnd.format("HH:mm"));
    }
  }, [schedule]);

  const { mutate, isPending } = useMutation({
    mutationFn: (updateData: Partial<IRoomSchedule>) =>
      roomsScheduleApis.updateSchedule(schedule._id, updateData),
    onSuccess: (_, variables) => {
      onClose();
      refetchSchedules();
      toast({
        title: "Success",
        description: `Schedule updated${
          variables.status ? " to " + variables.status : ""
        }`,
      });
    },
  });

  const handleUpdate = async (newStatus: RoomStatus) => {
    const updateData: Partial<IRoomSchedule> = { status: newStatus };

    // Nếu chuyển sang "In use", sử dụng thời gian đã điều chỉnh hoặc thời gian hiện tại
    if (newStatus === RoomStatus.InUse) {
      if (adjustedStartTime) {
        // Sử dụng thời gian đã điều chỉnh
        const datePart = dayjs(schedule.startTime).format("YYYY-MM-DD");
        const newStartTime = dayjs(`${datePart}T${adjustedStartTime}`);
        if (newStartTime.isValid()) {
          updateData.startTime = newStartTime.toISOString();
          // Thông báo cho người dùng biết đã sử dụng thời gian đã điều chỉnh
          toast({
            title: "Thời gian đã được điều chỉnh",
            description: `Sử dụng thời gian bắt đầu: ${adjustedStartTime}`,
          });
        } else {
          // Nếu thời gian không hợp lệ, sử dụng thời gian hiện tại
          updateData.startTime = dayjs().toISOString();
          toast({
            title: "Thời gian không hợp lệ",
            description: "Sử dụng thời gian hiện tại",
          });
        }
      } else {
        // Nếu chưa điều chỉnh thời gian, sử dụng thời gian hiện tại
        updateData.startTime = dayjs().toISOString();
      }
    }
    // Nếu chuyển sang "Cancelled", cập nhật endTime thành thời gian hiện tại.
    else if (newStatus === RoomStatus.Cancelled) {
      updateData.endTime = dayjs().toISOString();
    }

    // Gọi API update với dữ liệu mới (bao gồm status và thời gian)
    mutate(updateData);
  };

  // Hàm cập nhật thời gian mới dựa vào input
  const handleUpdateTime = () => {
    // Lấy phần ngày từ schedule hiện có
    const datePart = dayjs(schedule.startTime).format("YYYY-MM-DD");
    const newStartTime = dayjs(`${datePart}T${adjustedStartTime}`);
    const newEndTime = dayjs(`${datePart}T${adjustedEndTime}`);

    if (!newStartTime.isValid() || !newEndTime.isValid()) {
      toast({
        title: "Invalid time",
        description: "Please enter valid times.",
      });
      return;
    }

    if (newEndTime.isBefore(newStartTime)) {
      toast({
        title: "Invalid time",
        description: "End time must be after start time.",
      });
      return;
    }

    const updateData: Partial<IRoomSchedule> = {
      startTime: newStartTime.toISOString(),
      endTime: newEndTime.toISOString(),
    };

    mutate(updateData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>Process Booked Event</DialogTitle>
          <DialogDescription>
            Here is the event details. You can cancel the booking, mark the
            event as in use, or adjust the event time.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <p>
            <span className="font-medium">Start:</span>{" "}
            {eventStart.format("HH:mm")}
          </p>
          <p>
            <span className="font-medium">End:</span> {eventEnd.format("HH:mm")}
          </p>
          {schedule?.note && (
            <p>
              <span className="font-medium">Note:</span> {schedule.note}
            </p>
          )}
        </div>

        {/* Phần điều chỉnh thời gian */}
        <div className="mt-4 space-y-2">
          <h3 className="font-semibold">Adjust Time</h3>
          <div className="flex flex-col space-y-1">
            <label htmlFor="adjustedStartTime" className="text-sm">
              Start Time:
            </label>
            <input
              id="adjustedStartTime"
              type="time"
              value={adjustedStartTime}
              onChange={(e) => setAdjustedStartTime(e.target.value)}
              className="border rounded p-1"
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label htmlFor="adjustedEndTime" className="text-sm">
              End Time:
            </label>
            <input
              id="adjustedEndTime"
              type="time"
              value={adjustedEndTime}
              onChange={(e) => setAdjustedEndTime(e.target.value)}
              className="border rounded p-1"
            />
          </div>
          <Button
            variant="default"
            onClick={handleUpdateTime}
            loading={isPending}
          >
            Update Time
          </Button>
        </div>

        <DialogFooter className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={() => setIsMenuModalOpen(true)}>
            Order Snacks & Drinks
          </Button>

          <Button
            variant="default"
            onClick={() => {
              handleUpdate(RoomStatus.InUse);
            }}
            loading={isPending}
          >
            Mark as In Use
            {adjustedStartTime && (
              <span className="text-xs ml-1 opacity-70">
                ({adjustedStartTime})
              </span>
            )}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              handleUpdate(RoomStatus.Cancelled);
            }}
            loading={isPending}
          >
            Cancel Booking
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Modal đặt đồ ăn */}
      <MenuItemsModal
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
        menuItems={menuItems}
        roomId={schedule.roomId}
        scheduleId={schedule._id}
        createdBy={schedule.createdBy}
      />
    </Dialog>
  );
};

export default ProcessBookedModal;
