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
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import staffScheduleApis from "@/apis/staffSchedule.apis";
import { IEmployeeSchedule } from "@/apis/staffSchedule.apis";
import { EmployeeScheduleStatus } from "@/constants/enum";
import dayjs from "dayjs";
import { format } from "date-fns";
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
  const [rejectedReason, setRejectedReason] = useState("");

  // State for adjusting working hours and note
  const [adjustedStartTime, setAdjustedStartTime] = useState("");
  const [adjustedEndTime, setAdjustedEndTime] = useState("");
  const [adjustTimeError, setAdjustTimeError] = useState("");
  const [adjustedNote, setAdjustedNote] = useState("");

  // Initialize form values when schedule changes
  useEffect(() => {
    if (schedule) {
      setRejectedReason("");
      // Initialize adjusted times and note with current values
      setAdjustedStartTime(schedule.customStartTime || "");
      setAdjustedEndTime(schedule.customEndTime || "");
      setAdjustedNote(schedule.note || "");
      setAdjustTimeError("");
    }
  }, [schedule]);

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
      setRejectedReason("");
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
        setRejectedReason("");
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

  const handleUpdateScheduleInfo = () => {
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
      note?: string;
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

    if (adjustedNote !== schedule.note) {
      updateData.note = adjustedNote || undefined;
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

  // Check if schedule date is in the past
  const isPastSchedule = schedule.date
    ? dayjs(schedule.date).isBefore(dayjs(), "day")
    : false;

  const canCancel =
    !isStaff &&
    (schedule.status === EmployeeScheduleStatus.Pending ||
      schedule.status === EmployeeScheduleStatus.Approved);
  const canApprove =
    schedule.status === EmployeeScheduleStatus.Pending && !isStaff;
  const canReject =
    schedule.status === EmployeeScheduleStatus.Pending && !isStaff;
  const canStart =
    !isStaff && schedule.status === EmployeeScheduleStatus.Approved;
  const canComplete = schedule.status === EmployeeScheduleStatus.InProgress;
  const canMarkAbsent = schedule.status === EmployeeScheduleStatus.InProgress;
  const canDelete = !isStaff && !isPastSchedule; // Admin can delete if schedule is not in the past
  const isReadOnly =
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
    if (shift === "all") return "All Day (12:00 - 22:00)";
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
              {isReadOnly || isStaff
                ? "Thời gian làm việc"
                : "Điều chỉnh thời gian làm việc"}
            </Label>
            {isReadOnly || isStaff ? (
              // Read-only view for Completed status or Staff users
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">
                      Thời gian bắt đầu (HH:mm)
                    </Label>
                    <p className="mt-1 font-medium">
                      {schedule.customStartTime || "Chưa thiết lập"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">
                      Thời gian kết thúc (HH:mm)
                    </Label>
                    <p className="mt-1 font-medium">
                      {schedule.customEndTime || "Chưa thiết lập"}
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
              // Editable view for non-staff users and non-completed statuses
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
                {adjustedStartTime && adjustedEndTime && !adjustTimeError && (
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

                <div>
                  <Label htmlFor="adjustedNote">Ghi chú</Label>
                  <Textarea
                    id="adjustedNote"
                    placeholder="Nhập ghi chú..."
                    value={adjustedNote}
                    onChange={(e) => setAdjustedNote(e.target.value)}
                    className="mt-1 resize-none"
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Note */}
          {schedule.status === EmployeeScheduleStatus.Rejected &&
            schedule.rejectedReason && (
              <div>
                <Label className="text-sm font-semibold text-gray-500">
                  Lý do từ chối
                </Label>
                <p className="mt-1 text-sm">{schedule.rejectedReason}</p>
              </div>
            )}
          {schedule.status !== EmployeeScheduleStatus.Rejected &&
            schedule.note && (
              <div>
                <Label className="text-sm font-semibold text-gray-500">
                  Note
                </Label>
                <p className="mt-1 text-sm">{schedule.note}</p>
              </div>
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
          {canReject && !isReadOnly && (
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
          {!isReadOnly && !isStaff && (
            <Button
              onClick={handleUpdateScheduleInfo}
              disabled={
                isPending || isDeleting || isUpdatingStatus || !!adjustTimeError
              }
            >
              Cập nhật
            </Button>
          )}
          {canApprove && (
            <Button
              onClick={handleApprove}
              disabled={isPending || isDeleting || isUpdatingStatus}
            >
              Approve
            </Button>
          )}
          {canReject && (
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isPending || isDeleting || isUpdatingStatus}
            >
              Reject
            </Button>
          )}
          {canStart && (
            <Button
              onClick={handleStart}
              disabled={isPending || isDeleting || isUpdatingStatus}
            >
              Start
            </Button>
          )}
          {canComplete && (
            <Button
              onClick={handleComplete}
              disabled={isPending || isDeleting || isUpdatingStatus}
            >
              Complete
            </Button>
          )}
          {canMarkAbsent && (
            <Button
              variant="destructive"
              onClick={handleMarkAbsent}
              disabled={isPending || isDeleting || isUpdatingStatus}
            >
              Mark Absent
            </Button>
          )}
          {canCancel && (
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isPending || isDeleting || isUpdatingStatus}
            >
              Cancel Schedule
            </Button>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isPending || isDeleting || isUpdatingStatus}
            >
              Xóa
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StaffScheduleDetailModal;
