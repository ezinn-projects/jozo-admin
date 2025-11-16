import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import staffScheduleApis from "@/apis/staffSchedule.apis";
import { IEmployeeSchedule } from "@/apis/staffSchedule.apis";
import { EmployeeScheduleStatus } from "@/constants/enum";
import dayjs from "dayjs";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsStaff } from "@/hooks/usePermission";

interface StaffScheduleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: IEmployeeSchedule | null;
  refetchSchedules?: () => void;
}

const StaffScheduleDetailModal: React.FC<StaffScheduleDetailModalProps> = ({
  isOpen,
  onClose,
  schedule,
  refetchSchedules,
}) => {
  const isStaff = useIsStaff();
  const [cancelNote, setCancelNote] = useState("");
  const [rejectedReason, setRejectedReason] = useState("");
  const [editMode, setEditMode] = useState(false);

  // Form state for editing
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  const [editShiftType, setEditShiftType] = useState<
    "morning" | "afternoon" | "evening" | ""
  >("");
  const [editCustomStartTime, setEditCustomStartTime] = useState("");
  const [editCustomEndTime, setEditCustomEndTime] = useState("");
  const [editNote, setEditNote] = useState("");
  const [timeError, setTimeError] = useState("");

  // State for adjusting working hours (separate from edit mode)
  const [adjustedStartTime, setAdjustedStartTime] = useState("");
  const [adjustedEndTime, setAdjustedEndTime] = useState("");
  const [adjustTimeError, setAdjustTimeError] = useState("");

  // Initialize form values when schedule changes
  useEffect(() => {
    if (schedule) {
      setEditDate(schedule.date ? dayjs(schedule.date).toDate() : undefined);
      setEditShiftType(
        (schedule.shiftType || schedule.shift || "") as
          | "morning"
          | "afternoon"
          | "evening"
          | ""
      );
      setEditCustomStartTime(schedule.customStartTime || "");
      setEditCustomEndTime(schedule.customEndTime || "");
      setEditNote(schedule.note || "");
      setTimeError("");
      setEditMode(false);
      setCancelNote("");
      setRejectedReason("");
      // Initialize adjusted times with current custom times
      setAdjustedStartTime(schedule.customStartTime || "");
      setAdjustedEndTime(schedule.customEndTime || "");
      setAdjustTimeError("");
    }
  }, [schedule]);

  const canEdit =
    schedule?.status === EmployeeScheduleStatus.Pending ||
    schedule?.status === EmployeeScheduleStatus.Rejected;

  const { mutate: updateSchedule, isPending } = useMutation({
    mutationFn: (data: {
      date?: string;
      shiftType?: "morning" | "afternoon" | "evening";
      customStartTime?: string;
      customEndTime?: string;
      note?: string;
      status?: EmployeeScheduleStatus;
    }) => staffScheduleApis.updateSchedule(schedule!._id, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Schedule updated successfully",
      });
      setCancelNote("");
      setRejectedReason("");
      setEditMode(false);
      refetchSchedules?.();
      onClose();
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: {
          data?: {
            message?: string;
          };
        };
        message?: string;
      };
      toast({
        title: "Error",
        description:
          axiosError?.response?.data?.message ||
          axiosError?.message ||
          "Failed to update schedule",
        variant: "destructive",
      });
    },
  });

  // Separate mutation for updating time only (doesn't close modal)
  const { mutate: updateTimeOnly, isPending: isUpdatingTime } = useMutation({
    mutationFn: (data: { customStartTime?: string; customEndTime?: string }) =>
      staffScheduleApis.updateSchedule(schedule!._id, data),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Thời gian làm việc đã được cập nhật",
      });
      refetchSchedules?.();
      // Update adjusted times from the updated schedule
      if (schedule) {
        // The schedule will be updated via refetch, useEffect will handle the rest
      }
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: {
          data?: {
            message?: string;
          };
        };
        message?: string;
      };
      toast({
        title: "Lỗi",
        description:
          axiosError?.response?.data?.message ||
          axiosError?.message ||
          "Không thể cập nhật thời gian",
        variant: "destructive",
      });
    },
  });

  const { mutate: updateScheduleStatus, isPending: isUpdatingStatus } =
    useMutation({
      mutationFn: (data: {
        status: EmployeeScheduleStatus;
        rejectedReason?: string;
      }) => staffScheduleApis.updateScheduleStatus(schedule!._id, data),
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Schedule status updated successfully",
        });
        setCancelNote("");
        setRejectedReason("");
        setEditMode(false);
        refetchSchedules?.();
        onClose();
      },
      onError: (error: unknown) => {
        const axiosError = error as {
          response?: {
            data?: {
              message?: string;
            };
          };
          message?: string;
        };
        toast({
          title: "Error",
          description:
            axiosError?.response?.data?.message ||
            axiosError?.message ||
            "Failed to update schedule status",
          variant: "destructive",
        });
      },
    });

  const { mutate: deleteSchedule, isPending: isDeleting } = useMutation({
    mutationFn: () => staffScheduleApis.deleteSchedule(schedule!._id),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Schedule cancelled successfully",
      });
      setCancelNote("");
      refetchSchedules?.();
      onClose();
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: {
          data?: {
            message?: string;
          };
        };
        message?: string;
      };
      toast({
        title: "Error",
        description:
          axiosError?.response?.data?.message ||
          axiosError?.message ||
          "Failed to cancel schedule",
        variant: "destructive",
      });
    },
  });

  const validateTime = (startTime: string, endTime: string): boolean => {
    if (!startTime || !endTime) {
      setTimeError("");
      return true; // Allow empty times
    }

    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);

    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;

    if (startTotal >= endTotal) {
      setTimeError("Start time must be before end time");
      return false;
    }

    setTimeError("");
    return true;
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditCustomStartTime(value);
    if (editCustomEndTime) {
      validateTime(value, editCustomEndTime);
    }
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditCustomEndTime(value);
    if (editCustomStartTime) {
      validateTime(editCustomStartTime, value);
    }
  };

  // Calculate working minutes from adjusted times
  const calculateWorkingMinutes = (
    startTime: string,
    endTime: string
  ): number | null => {
    if (!startTime || !endTime) return null;

    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);

    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;

    if (startTotal >= endTotal) return null;

    return endTotal - startTotal;
  };

  // Validate adjusted time
  const validateAdjustedTime = (
    startTime: string,
    endTime: string
  ): boolean => {
    if (!startTime || !endTime) {
      setAdjustTimeError("");
      return true; // Allow empty times
    }

    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);

    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;

    if (startTotal >= endTotal) {
      setAdjustTimeError("Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc");
      return false;
    }

    setAdjustTimeError("");
    return true;
  };

  const handleAdjustedStartTimeChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setAdjustedStartTime(value);
    if (adjustedEndTime) {
      validateAdjustedTime(value, adjustedEndTime);
    }
  };

  const handleAdjustedEndTimeChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setAdjustedEndTime(value);
    if (adjustedStartTime) {
      validateAdjustedTime(adjustedStartTime, value);
    }
  };

  const handleSaveAdjustedTime = () => {
    if (!schedule) return;

    // Validate time if both are provided
    if (adjustedStartTime && adjustedEndTime) {
      if (!validateAdjustedTime(adjustedStartTime, adjustedEndTime)) {
        return;
      }
    }

    const updateData: {
      customStartTime?: string;
      customEndTime?: string;
    } = {};

    if (adjustedStartTime) {
      updateData.customStartTime = adjustedStartTime;
    } else {
      updateData.customStartTime = undefined;
    }

    if (adjustedEndTime) {
      updateData.customEndTime = adjustedEndTime;
    } else {
      updateData.customEndTime = undefined;
    }

    updateTimeOnly(updateData);
  };

  const handleSaveEdit = () => {
    if (!schedule) return;

    // Validate time if both are provided
    if (editCustomStartTime && editCustomEndTime) {
      if (!validateTime(editCustomStartTime, editCustomEndTime)) {
        return;
      }
    }

    const updateData: {
      date?: string;
      shiftType?: "morning" | "afternoon" | "evening";
      customStartTime?: string;
      customEndTime?: string;
      note?: string;
    } = {};

    if (editDate) {
      updateData.date = format(editDate, "yyyy-MM-dd");
    }
    if (editShiftType) {
      updateData.shiftType = editShiftType as
        | "morning"
        | "afternoon"
        | "evening";
    }
    if (editCustomStartTime) {
      updateData.customStartTime = editCustomStartTime;
    }
    if (editCustomEndTime) {
      updateData.customEndTime = editCustomEndTime;
    }
    if (editNote !== schedule.note) {
      updateData.note = editNote || undefined;
    }

    updateSchedule(updateData);
  };

  const handleCancel = () => {
    if (!schedule) return;
    deleteSchedule();
  };

  const handleApprove = () => {
    if (!schedule) return;
    updateScheduleStatus({
      status: EmployeeScheduleStatus.Approved,
    });
  };

  const handleReject = () => {
    if (!schedule) return;
    updateScheduleStatus({
      status: EmployeeScheduleStatus.Rejected,
      rejectedReason: rejectedReason || undefined,
    });
  };

  const handleStart = () => {
    if (!schedule) return;
    updateScheduleStatus({
      status: EmployeeScheduleStatus.InProgress,
    });
  };

  const handleComplete = () => {
    if (!schedule) return;
    updateScheduleStatus({
      status: EmployeeScheduleStatus.Completed,
    });
  };

  const handleMarkAbsent = () => {
    if (!schedule) return;
    updateScheduleStatus({
      status: EmployeeScheduleStatus.Absent,
    });
  };

  if (!schedule) return null;

  const canCancel =
    !isStaff &&
    (schedule.status === EmployeeScheduleStatus.Pending ||
      schedule.status === EmployeeScheduleStatus.Approved);
  const canApprove = schedule.status === EmployeeScheduleStatus.Pending;
  const canReject = schedule.status === EmployeeScheduleStatus.Pending;
  const canStart =
    !isStaff && schedule.status === EmployeeScheduleStatus.Approved;
  const canComplete = schedule.status === EmployeeScheduleStatus.InProgress;
  const canMarkAbsent = schedule.status === EmployeeScheduleStatus.InProgress;
  const isReadOnly =
    schedule.status === EmployeeScheduleStatus.Completed ||
    schedule.status === EmployeeScheduleStatus.Cancelled ||
    schedule.status === EmployeeScheduleStatus.Absent ||
    schedule.status === EmployeeScheduleStatus.Rejected;

  const getStatusLabel = (status: EmployeeScheduleStatus) => {
    switch (status) {
      case EmployeeScheduleStatus.Pending:
        return "Pending";
      case EmployeeScheduleStatus.Approved:
        return "Approved";
      case EmployeeScheduleStatus.InProgress:
        return "In Progress";
      case EmployeeScheduleStatus.Completed:
        return "Completed";
      case EmployeeScheduleStatus.Rejected:
        return "Rejected";
      case EmployeeScheduleStatus.Cancelled:
        return "Cancelled";
      case EmployeeScheduleStatus.Absent:
        return "Absent";
      default:
        return status;
    }
  };

  const getShiftLabel = (shift?: string) => {
    if (shift === "morning") return "Morning (12:00 - 17:00)";
    if (shift === "afternoon") return "Afternoon (17:00 - 22:00)";
    if (shift === "evening") return "Evening";
    return shift || "N/A";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold text-gray-500">
                Staff Name
              </Label>
              <p className="mt-1">
                {schedule.userName ||
                  schedule.user?.name ||
                  schedule.user?.full_name ||
                  "N/A"}
              </p>
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-500">
                Status
              </Label>
              <p className="mt-1 font-medium">
                {getStatusLabel(schedule.status)}
              </p>
            </div>
          </div>

          {/* Editable Fields - Only show when canEdit and in edit mode */}
          {canEdit && editMode ? (
            <div className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editDate">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !editDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editDate
                          ? format(editDate, "dd/MM/yyyy")
                          : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editDate}
                        onSelect={(date) => date && setEditDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="editShiftType">Shift Type</Label>
                  <Select
                    value={editShiftType}
                    onValueChange={(value) =>
                      setEditShiftType(
                        value as "morning" | "afternoon" | "evening"
                      )
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="afternoon">Afternoon</SelectItem>
                      <SelectItem value="evening">Evening</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editCustomStartTime">
                    Custom Start Time (HH:mm)
                  </Label>
                  <Input
                    id="editCustomStartTime"
                    type="time"
                    value={editCustomStartTime}
                    onChange={handleStartTimeChange}
                    className="mt-1"
                    placeholder="08:00"
                  />
                </div>
                <div>
                  <Label htmlFor="editCustomEndTime">
                    Custom End Time (HH:mm)
                  </Label>
                  <Input
                    id="editCustomEndTime"
                    type="time"
                    value={editCustomEndTime}
                    onChange={handleEndTimeChange}
                    className="mt-1"
                    placeholder="17:00"
                  />
                </div>
              </div>
              {timeError && <p className="text-sm text-red-500">{timeError}</p>}

              <div>
                <Label htmlFor="editNote">Note</Label>
                <Textarea
                  id="editNote"
                  placeholder="Enter note..."
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="mt-1 resize-none"
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Read-only display */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-500">
                    Date
                  </Label>
                  <p className="mt-1">
                    {schedule.date
                      ? format(dayjs(schedule.date).toDate(), "dd/MM/yyyy")
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-500">
                    Shift
                  </Label>
                  <p className="mt-1">
                    {getShiftLabel(schedule.shift || schedule.shiftType)}
                  </p>
                </div>
              </div>

              {/* Custom Time Section - Editable or Read-only */}
              <div className="border-t pt-4">
                <Label className="text-sm font-semibold text-gray-500 mb-2 block">
                  {isReadOnly
                    ? "Thời gian làm việc"
                    : "Điều chỉnh thời gian làm việc"}
                </Label>
                {isReadOnly ? (
                  // Read-only view for Completed status
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-500">
                          Thời gian bắt đầu (HH:mm)
                        </Label>
                        <p className="mt-1 font-medium">
                          {schedule.customStartTime || "Not set"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">
                          Thời gian kết thúc (HH:mm)
                        </Label>
                        <p className="mt-1 font-medium">
                          {schedule.customEndTime || "Not set"}
                        </p>
                      </div>
                    </div>

                    {/* Display working minutes and salary for read-only */}
                    {schedule.customStartTime && schedule.customEndTime && (
                      <div className="bg-blue-50 p-3 rounded-md space-y-1">
                        {(() => {
                          const minutes = calculateWorkingMinutes(
                            schedule.customStartTime!,
                            schedule.customEndTime!
                          );
                          if (minutes === null) return null;
                          const hours = Math.floor(minutes / 60);
                          const mins = minutes % 60;
                          const hourlyRate = 22000; // 22k VND per hour
                          const salary = (minutes / 60) * hourlyRate;

                          return (
                            <>
                              <div className="text-sm">
                                <span className="text-gray-600">
                                  Tổng thời gian:{" "}
                                </span>
                                <span className="font-semibold">
                                  {hours > 0 && `${hours} giờ `}
                                  {mins > 0 && `${mins} phút`}
                                  {hours === 0 && mins === 0 && "0 phút"}
                                </span>
                                <span className="text-gray-500 ml-2">
                                  ({minutes} phút)
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-600">
                                  Ước tính lương:{" "}
                                </span>
                                <span className="font-semibold text-green-600">
                                  {salary.toLocaleString("vi-VN")} VNĐ
                                </span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ) : (
                  // Editable view for other statuses
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-500">
                          Thời gian bắt đầu (HH:mm)
                        </Label>
                        <Input
                          type="time"
                          value={adjustedStartTime}
                          onChange={handleAdjustedStartTimeChange}
                          className="mt-1"
                          placeholder="08:00"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">
                          Thời gian kết thúc (HH:mm)
                        </Label>
                        <Input
                          type="time"
                          value={adjustedEndTime}
                          onChange={handleAdjustedEndTimeChange}
                          className="mt-1"
                          placeholder="17:00"
                        />
                      </div>
                    </div>
                    {adjustTimeError && (
                      <p className="text-sm text-red-500">{adjustTimeError}</p>
                    )}

                    {/* Display working minutes and estimated salary */}
                    {adjustedStartTime &&
                      adjustedEndTime &&
                      !adjustTimeError && (
                        <div className="bg-blue-50 p-3 rounded-md space-y-1">
                          {(() => {
                            const minutes = calculateWorkingMinutes(
                              adjustedStartTime,
                              adjustedEndTime
                            );
                            if (minutes === null) return null;
                            const hours = Math.floor(minutes / 60);
                            const mins = minutes % 60;
                            const hourlyRate = 22000; // 22k VND per hour
                            const salary = (minutes / 60) * hourlyRate;

                            return (
                              <>
                                <div className="text-sm">
                                  <span className="text-gray-600">
                                    Tổng thời gian:{" "}
                                  </span>
                                  <span className="font-semibold">
                                    {hours > 0 && `${hours} giờ `}
                                    {mins > 0 && `${mins} phút`}
                                    {hours === 0 && mins === 0 && "0 phút"}
                                  </span>
                                  <span className="text-gray-500 ml-2">
                                    ({minutes} phút)
                                  </span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-gray-600">
                                    Ước tính lương:{" "}
                                  </span>
                                  <span className="font-semibold text-green-600">
                                    {salary.toLocaleString("vi-VN")} VNĐ
                                  </span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}

                    {!isStaff && (
                      <Button
                        onClick={handleSaveAdjustedTime}
                        disabled={
                          isPending ||
                          isDeleting ||
                          isUpdatingStatus ||
                          isUpdatingTime ||
                          !!adjustTimeError
                        }
                        className="w-full"
                      >
                        {isUpdatingTime ? "Đang lưu..." : "Lưu thời gian"}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Note */}
              {schedule.note && (
                <div>
                  <Label className="text-sm font-semibold text-gray-500">
                    Note
                  </Label>
                  <p className="mt-1 text-sm">{schedule.note}</p>
                </div>
              )}
            </>
          )}

          {/* Timeline Info */}
          <div className="border-t pt-4 space-y-2">
            {schedule.createdByName && (
              <div className="text-sm">
                <span className="text-gray-500">Created by: </span>
                <span>{schedule.createdByName}</span>
                {schedule.createdAt && (
                  <span className="text-gray-400 ml-2">
                    (
                    {format(
                      dayjs(schedule.createdAt).toDate(),
                      "dd/MM/yyyy HH:mm"
                    )}
                    )
                  </span>
                )}
              </div>
            )}
            {schedule.approvedByName && (
              <div className="text-sm">
                <span className="text-gray-500">Approved by: </span>
                <span>{schedule.approvedByName}</span>
                {schedule.approvedAt && (
                  <span className="text-gray-400 ml-2">
                    (
                    {format(
                      dayjs(schedule.approvedAt).toDate(),
                      "dd/MM/yyyy HH:mm"
                    )}
                    )
                  </span>
                )}
              </div>
            )}
            {schedule.startedAt && (
              <div className="text-sm">
                <span className="text-gray-500">Started at: </span>
                <span>
                  {format(
                    dayjs(schedule.startedAt).toDate(),
                    "dd/MM/yyyy HH:mm"
                  )}
                </span>
              </div>
            )}
            {schedule.completedAt && (
              <div className="text-sm">
                <span className="text-gray-500">Completed at: </span>
                <span>
                  {format(
                    dayjs(schedule.completedAt).toDate(),
                    "dd/MM/yyyy HH:mm"
                  )}
                </span>
              </div>
            )}
            {schedule.markedAbsentBy && (
              <div className="text-sm">
                <span className="text-gray-500">Marked absent by: </span>
                <span>{schedule.markedAbsentBy}</span>
                {schedule.markedAbsentAt && (
                  <span className="text-gray-400 ml-2">
                    (
                    {format(
                      dayjs(schedule.markedAbsentAt).toDate(),
                      "dd/MM/yyyy HH:mm"
                    )}
                    )
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action Note Input */}
          {canCancel && !isReadOnly && !editMode && (
            <div>
              <Label htmlFor="cancelNote">Note (optional)</Label>
              <Textarea
                id="cancelNote"
                placeholder="Enter a note for this action..."
                value={cancelNote}
                onChange={(e) => setCancelNote(e.target.value)}
                className="mt-1 resize-none"
                rows={3}
              />
            </div>
          )}
          {canReject && !isReadOnly && !editMode && (
            <div>
              <Label htmlFor="rejectedReason">Rejection Reason</Label>
              <Textarea
                id="rejectedReason"
                placeholder="Enter rejection reason..."
                value={rejectedReason}
                onChange={(e) => setRejectedReason(e.target.value)}
                className="mt-1 resize-none"
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending || isDeleting || isUpdatingStatus}
          >
            Close
          </Button>
          {canEdit && !editMode && (
            <Button variant="outline" onClick={() => setEditMode(true)}>
              Edit
            </Button>
          )}
          {canEdit && editMode && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setEditMode(false);
                  // Reset form values
                  if (schedule) {
                    setEditDate(
                      schedule.date ? dayjs(schedule.date).toDate() : undefined
                    );
                    setEditShiftType(
                      (schedule.shiftType || schedule.shift || "") as
                        | "morning"
                        | "afternoon"
                        | "evening"
                        | ""
                    );
                    setEditCustomStartTime(schedule.customStartTime || "");
                    setEditCustomEndTime(schedule.customEndTime || "");
                    setEditNote(schedule.note || "");
                    setTimeError("");
                  }
                }}
                disabled={isPending || isDeleting || isUpdatingStatus}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={
                  isPending || isDeleting || isUpdatingStatus || !!timeError
                }
              >
                Save Changes
              </Button>
            </>
          )}
          {canApprove && !editMode && (
            <Button
              onClick={handleApprove}
              disabled={isPending || isDeleting || isUpdatingStatus}
            >
              Approve
            </Button>
          )}
          {canReject && !editMode && (
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isPending || isDeleting || isUpdatingStatus}
            >
              Reject
            </Button>
          )}
          {canStart && !editMode && (
            <Button
              onClick={handleStart}
              disabled={isPending || isDeleting || isUpdatingStatus}
            >
              Start
            </Button>
          )}
          {canComplete && !editMode && (
            <Button
              onClick={handleComplete}
              disabled={isPending || isDeleting || isUpdatingStatus}
            >
              Complete
            </Button>
          )}
          {canMarkAbsent && !editMode && (
            <Button
              variant="destructive"
              onClick={handleMarkAbsent}
              disabled={isPending || isDeleting || isUpdatingStatus}
            >
              Mark Absent
            </Button>
          )}
          {canCancel && !editMode && (
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isPending || isDeleting || isUpdatingStatus}
            >
              Cancel Schedule
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StaffScheduleDetailModal;
