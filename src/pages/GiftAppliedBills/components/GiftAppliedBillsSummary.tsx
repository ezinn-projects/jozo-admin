import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { Gift, Sparkles, TrendingDown, Users, Zap } from "lucide-react";
import type { GiftAppliedBillsSummary } from "../constants";

interface GiftAppliedBillsSummaryProps {
  summary?: GiftAppliedBillsSummary;
}

const formatMoney = (value: number) => `${formatCurrency(value || 0)} VNĐ`;

const GiftAppliedBillsSummaryCards = ({
  summary,
}: GiftAppliedBillsSummaryProps) => {
  const totalDiscount =
    (summary?.totalGiftDiscountAmount ?? 0) +
    (summary?.totalMembershipDiscountAmount ?? 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tổng bill</CardTitle>
          <Gift className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary?.totalBills ?? 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Membership</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {summary?.membershipBills ?? 0}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Quà tặng</CardTitle>
          <Sparkles className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">
            {summary?.giftBills ?? 0}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Streak</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-violet-600">
            {summary?.streakBills ?? 0}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tổng tiền giảm</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">{formatMoney(totalDiscount)}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GiftAppliedBillsSummaryCards;
