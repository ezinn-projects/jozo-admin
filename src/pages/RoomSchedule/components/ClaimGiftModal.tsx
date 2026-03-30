import {
  IClaimGiftPayload,
  IEligibleGift,
  IPendingGift,
} from "@/@types/Membership";
import membershipApis from "@/apis/membership.apis";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import dayjs from "dayjs";
import { Gift, History, Loader2, Search, Star, User } from "lucide-react";
import React, { useEffect, useState } from "react";

interface ClaimGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleId: string;
  defaultPhone?: string;
  onGiftClaimed: () => void;
}

type SelectedGift = {
  type: "pending" | "eligible";
  gift: IPendingGift | IEligibleGift;
};

const ClaimGiftModal: React.FC<ClaimGiftModalProps> = ({
  isOpen,
  onClose,
  scheduleId,
  defaultPhone = "",
  onGiftClaimed,
}) => {
  const [phoneNumber, setPhoneNumber] = useState(defaultPhone);
  const [shouldFetch, setShouldFetch] = useState(false);
  const [selectedGift, setSelectedGift] = useState<SelectedGift | null>(null);

  // Reset phone number when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhoneNumber(defaultPhone);
      setSelectedGift(null);
      // Auto-fetch if there's a default phone
      if (defaultPhone && defaultPhone.length >= 10) {
        setShouldFetch(true);
      } else {
        setShouldFetch(false);
      }
    }
  }, [isOpen, defaultPhone]);

  // Validate phone number
  const isPhoneValid = /^0\d{9,10}$/.test(phoneNumber);

  // Query to fetch pending gifts
  const {
    data: giftData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["pendingGifts", phoneNumber],
    queryFn: () => membershipApis.getPendingGifts(phoneNumber),
    enabled: shouldFetch && isPhoneValid,
    retry: false,
  });

  // Mutation to claim gift
  const { mutate: claimGift, isPending: isClaimingGift } = useMutation({
    mutationFn: (payload: IClaimGiftPayload) =>
      membershipApis.claimGift(payload),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã phục vụ quà tặng cho khách hàng",
      });
      onGiftClaimed();
      onClose();
    },
    onError: (error: AxiosError<{ message: string }>) => {
      console.error("Error claiming gift:", error);
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message ||
          "Không thể phục vụ quà tặng. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (!isPhoneValid) {
      toast({
        title: "Lỗi",
        description: "Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0)",
        variant: "destructive",
      });
      return;
    }
    setShouldFetch(true);
    refetch();
  };

  const handleClaimGift = () => {
    if (!selectedGift) return;

    const payload: IClaimGiftPayload = {
      phone: phoneNumber,
      streakCount: selectedGift.gift.streakCount,
      scheduleId: scheduleId,
    };

    claimGift(payload);
  };

  const giftsResult = giftData?.data?.result;
  const user = giftsResult?.user;
  const pendingGifts = giftsResult?.pending || [];
  const eligibleGifts = giftsResult?.eligible || [];

  // Query to fetch gift claim history
  const {
    data: streakData,
    isLoading: isLoadingHistory,
  } = useQuery({
    queryKey: ["streakInfo", user?.userId],
    queryFn: () => membershipApis.getMemberStreakInfo(user!.userId),
    enabled: !!user?.userId,
  });

  const claimedRewards = streakData?.data?.result?.claimedRewards || [];

  const renderGiftCard = (
    gift: IPendingGift | IEligibleGift,
    type: "pending" | "eligible",
  ) => {
    const isPending = type === "pending";
    const isSelected =
      selectedGift?.type === type &&
      selectedGift?.gift.giftId === gift.giftId &&
      selectedGift?.gift.streakCount === gift.streakCount;

    return (
      <Card
        key={`${gift.giftId}-${gift.streakCount}`}
        className={`cursor-pointer transition-all hover:shadow-md ${
          isSelected ? "border-pink-500 border-2 bg-pink-50" : ""
        }`}
        onClick={() =>
          setSelectedGift({
            type,
            gift,
          })
        }
      >
        <CardContent className="p-4">
          <div className="flex gap-4">
            {gift.giftImage && (
              <img
                src={gift.giftImage}
                alt={gift.giftName}
                className="w-20 h-20 object-cover rounded-md"
              />
            )}
            <div className="flex-1">
              <h4 className="font-semibold text-lg">{gift.giftName}</h4>
              <p className="text-sm text-gray-600">
                Loại:{" "}
                {gift.giftType === "snacks_drinks"
                  ? "Đồ ăn/Nước"
                  : gift.giftType}
              </p>
              <p className="text-sm text-purple-600 font-medium">
                Streak: {gift.streakCount}
              </p>
              {isPending && "assignedAt" in gift && (
                <p className="text-xs text-gray-500">
                  Assigned: {dayjs(gift.assignedAt).format("DD/MM/YYYY HH:mm")}
                </p>
              )}
              {!isPending && "bonusPoints" in gift && gift.bonusPoints && (
                <p className="text-xs text-green-600">
                  Bonus: +{gift.bonusPoints} điểm
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-pink-500" />
            Phục vụ quà tặng
          </DialogTitle>
          <DialogDescription>
            {defaultPhone && isPhoneValid
              ? "Chọn quà tặng để phục vụ cho khách hàng"
              : "Nhập số điện thoại để tra cứu quà tặng của khách hàng"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Phone Input Section - Only show if no defaultPhone */}
          {!defaultPhone || !isPhoneValid ? (
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0357888701"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  className={
                    !isPhoneValid && phoneNumber ? "border-red-500" : ""
                  }
                />
                {!isPhoneValid && phoneNumber && (
                  <p className="text-xs text-red-500 mt-1">
                    Số điện thoại không hợp lệ
                  </p>
                )}
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleSearch}
                  disabled={!isPhoneValid || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang tìm...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Tra cứu
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <User className="w-4 h-4 text-blue-600" />
              <span className="text-sm">
                <span className="text-gray-600">Đang tra cứu cho: </span>
                <span className="font-semibold text-blue-700">
                  {phoneNumber}
                </span>
              </span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-red-500 bg-red-50">
              <CardContent className="p-4">
                <p className="text-red-700 text-sm">
                  {(error as any)?.response?.status === 404
                    ? "Không tìm thấy khách hàng với số điện thoại này"
                    : (error as any)?.response?.data?.message ||
                      "Có lỗi xảy ra khi tra cứu. Vui lòng thử lại."}
                </p>
              </CardContent>
            </Card>
          )}

          {/* User Info Card */}
          {user && (
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5 text-purple-600" />
                  Thông tin khách hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Tên:</p>
                    <p className="font-semibold">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tier:</p>
                    <p className="font-semibold text-purple-600">{user.tier}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Điểm:</p>
                    <p className="font-semibold text-green-600">
                      {user.availablePoint}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Streak:</p>
                    <p className="font-semibold text-orange-600">
                      {user.streakCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gifts Section */}
          {user && (
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">
                  Pending ({pendingGifts.length})
                </TabsTrigger>
                <TabsTrigger value="eligible">
                  Eligible ({eligibleGifts.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-1">
                  <History className="w-3.5 h-3.5" />
                  Lịch sử ({claimedRewards.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-3 mt-4">
                {pendingGifts.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                      <Gift className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Không có quà tặng đang chờ phát</p>
                    </CardContent>
                  </Card>
                ) : (
                  pendingGifts.map((gift) => renderGiftCard(gift, "pending"))
                )}
              </TabsContent>

              <TabsContent value="eligible" className="space-y-3 mt-4">
                {eligibleGifts.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                      <Gift className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Không có quà tặng đủ điều kiện</p>
                    </CardContent>
                  </Card>
                ) : (
                  eligibleGifts.map((gift) => renderGiftCard(gift, "eligible"))
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-3 mt-4">
                {isLoadingHistory ? (
                  <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                      <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin opacity-50" />
                      <p>Đang tải lịch sử...</p>
                    </CardContent>
                  </Card>
                ) : claimedRewards.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                      <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Chưa có lịch sử nhận quà tặng</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {[...claimedRewards]
                      .sort(
                        (a, b) =>
                          dayjs(b.claimedAt).valueOf() -
                          dayjs(a.claimedAt).valueOf(),
                      )
                      .map((reward, idx) => (
                        <Card
                          key={idx}
                          className="border-gray-200 hover:shadow-sm transition-shadow"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="p-2 bg-purple-50 rounded-lg shrink-0">
                                  <Gift className="w-5 h-5 text-purple-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  {reward.gift ? (
                                    <>
                                      <p className="font-semibold text-gray-800 truncate">
                                        {reward.gift.giftName}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        Loại:{" "}
                                        {reward.gift.giftType === "snacks_drinks"
                                          ? "Đồ ăn/Nước"
                                          : reward.gift.giftType}
                                      </p>
                                    </>
                                  ) : (
                                    <p className="font-semibold text-gray-800">
                                      Thưởng điểm
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="flex items-center gap-1 text-xs text-orange-600">
                                      <Star className="w-3 h-3" />
                                      Streak {reward.streakCount}
                                    </span>
                                    {reward.points && reward.points > 0 && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs bg-green-100 text-green-700 px-1.5 py-0"
                                      >
                                        +{reward.points} điểm
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs text-gray-500">
                                  {dayjs(reward.claimedAt).format(
                                    "DD/MM/YYYY",
                                  )}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {dayjs(reward.claimedAt).format("HH:mm")}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isClaimingGift}>
            Đóng
          </Button>
          <Button
            onClick={handleClaimGift}
            disabled={!selectedGift || isClaimingGift}
            className="bg-pink-600 hover:bg-pink-700"
          >
            {isClaimingGift ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang phục vụ...
              </>
            ) : (
              <>
                <Gift className="w-4 h-4 mr-2" />
                Phục vụ
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClaimGiftModal;
