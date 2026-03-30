import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePendingGifts } from "@/hooks/use-membership";
import { Loader2, User, Phone, Star, Flame, Award } from "lucide-react";
import React from "react";

interface MemberInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone?: string;
}

const MemberInfoModal: React.FC<MemberInfoModalProps> = ({
  isOpen,
  onClose,
  phone,
}) => {
  const { data: memberData, isLoading, isError } = usePendingGifts(phone);

  // Mapping tier colors
  const getTierColor = (tier?: string) => {
    switch (tier?.toLowerCase()) {
      case "vip":
      case "diamond":
        return "text-purple-600 bg-purple-100";
      case "gold":
        return "text-yellow-600 bg-yellow-100";
      case "silver":
        return "text-gray-600 bg-gray-100";
      case "bronze":
        return "text-orange-600 bg-orange-100";
      default:
        return "text-blue-600 bg-blue-100";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Thông tin thành viên
          </DialogTitle>
          <DialogDescription>
            Xem thông tin điểm tích lũy và streak của khách hàng
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            <span className="ml-2 text-gray-600">Đang tải thông tin...</span>
          </div>
        )}

        {isError && (
          <div className="text-center py-8">
            <p className="text-red-600">
              Không thể tải thông tin thành viên. Vui lòng thử lại.
            </p>
          </div>
        )}

        {!isLoading && !isError && memberData?.user && (
          <div className="space-y-4">
            {/* Avatar & Name */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
              <div className="w-16 h-16 rounded-full bg-purple-200 flex items-center justify-center">
                <User className="w-8 h-8 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800">
                  {memberData.user.name}
                </h3>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{memberData.user.phone_number}</span>
                </div>
              </div>
            </div>

            {/* Tier Badge */}
            <div className="flex items-center justify-center">
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${getTierColor(
                  memberData.user.tier
                )}`}
              >
                <Award className="w-5 h-5" />
                <span className="uppercase">
                  {memberData.user.tier || "Member"}
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Points */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Điểm tích lũy
                  </span>
                </div>
                <div className="text-2xl font-bold text-yellow-600">
                  {memberData.user.availablePoint.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-1">điểm</p>
              </div>

              {/* Streak */}
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Streak hiện tại
                  </span>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {memberData.user.streakCount}
                </div>
                <p className="text-xs text-gray-500 mt-1">ngày liên tiếp</p>
              </div>
            </div>

            {/* Pending Gifts Info */}
            {memberData.pending && memberData.pending.length > 0 && (
              <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg">
                <p className="text-sm font-medium text-pink-700">
                  🎁 Có {memberData.pending.length} quà tặng đang chờ nhận
                </p>
              </div>
            )}

            {/* Eligible Gifts Info */}
            {memberData.eligible && memberData.eligible.length > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-700">
                  ✨ Đủ điều kiện nhận {memberData.eligible.length} quà mới
                </p>
              </div>
            )}

            {/* Note */}
            <div className="text-center text-xs text-gray-500 pt-2 border-t">
              Thông tin được cập nhật tự động sau khi kết thúc phiên
            </div>
          </div>
        )}

        {!isLoading && !isError && !memberData?.user && (
          <div className="text-center py-8">
            <p className="text-gray-600">
              Không tìm thấy thông tin thành viên với số điện thoại này.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MemberInfoModal;
