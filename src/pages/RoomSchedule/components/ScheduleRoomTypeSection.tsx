import { IRoomSchedule } from "@/@types/Room";
import roomsScheduleApis from "@/apis/roomSchedule.api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoomType } from "@/constants/enum";
import { toast } from "@/hooks/use-toast";
import { roomTypeOptions } from "@/pages/RoomsManagement/constants";
import { useMutation } from "@tanstack/react-query";
import React from "react";
import {
  getEffectiveScheduleRoomType,
  getRoomTypeLabel,
  isScheduleRoomTypeEditable,
} from "../utils/scheduleRoomType";

interface ScheduleRoomTypeSectionProps {
  schedule: IRoomSchedule;
  physicalRoomType?: RoomType;
  canEdit?: boolean;
  onUpdated?: () => void;
  className?: string;
}

const ScheduleRoomTypeSection: React.FC<ScheduleRoomTypeSectionProps> = ({
  schedule,
  physicalRoomType,
  canEdit,
  onUpdated,
  className,
}) => {
  const effectiveRoomType = getEffectiveScheduleRoomType(
    schedule,
    physicalRoomType ? { roomType: physicalRoomType } : undefined,
  );
  const editable =
    (canEdit ?? isScheduleRoomTypeEditable(schedule)) && !!schedule._id;
  const [selectedType, setSelectedType] = React.useState<RoomType>(
    effectiveRoomType || RoomType.Medium,
  );

  React.useEffect(() => {
    if (effectiveRoomType) {
      setSelectedType(effectiveRoomType);
    }
  }, [effectiveRoomType, schedule._id]);

  const { mutate: updateRoomType, isPending } = useMutation({
    mutationFn: (roomType: RoomType) =>
      roomsScheduleApis.updateSchedule(schedule._id, { roomType }),
    onSuccess: () => {
      toast({
        title: "Đã cập nhật",
        description: "Đã lưu size.",
      });
      onUpdated?.();
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không lưu được size.",
        variant: "destructive",
      });
    },
  });

  const hasTypeChanged = selectedType !== effectiveRoomType;

  return (
    <div className={className}>
      <h3 className="font-semibold mb-2">Size đang dùng</h3>
      {editable ? (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Size</Label>
            <Select
              value={selectedType}
              onValueChange={(value) => setSelectedType(value as RoomType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn size" />
              </SelectTrigger>
              <SelectContent>
                {roomTypeOptions.map((option) => (
                  <SelectItem value={option.value} key={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {physicalRoomType && physicalRoomType !== effectiveRoomType && (
            <p className="text-xs text-muted-foreground">
              Size gốc: {getRoomTypeLabel(physicalRoomType).toLowerCase()}.
            </p>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => updateRoomType(selectedType)}
            loading={isPending}
            disabled={!hasTypeChanged}
          >
            Lưu size
          </Button>
        </div>
      ) : (
        <p className="text-sm">
          {getRoomTypeLabel(effectiveRoomType)}
          {physicalRoomType &&
            physicalRoomType !== effectiveRoomType &&
            ` (size gốc: ${getRoomTypeLabel(physicalRoomType).toLowerCase()})`}
        </p>
      )}
    </div>
  );
};

export default ScheduleRoomTypeSection;
