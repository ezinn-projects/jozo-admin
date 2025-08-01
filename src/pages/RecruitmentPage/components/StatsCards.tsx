import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { User, Clock, Briefcase } from "lucide-react";
import { RecruitmentStats } from "@/@types/Recruitment";

interface StatsCardsProps {
  stats?: RecruitmentStats;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng cộng</p>
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Chờ xử lý</p>
              <p className="text-2xl font-bold">{stats?.pending || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Briefcase className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Đã xem xét</p>
              <p className="text-2xl font-bold">{stats?.reviewed || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Briefcase className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Đã liên hệ</p>
              <p className="text-2xl font-bold">{stats?.contacted || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <Briefcase className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Từ chối</p>
              <p className="text-2xl font-bold">{stats?.rejected || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Briefcase className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Đã tuyển dụng</p>
              <p className="text-2xl font-bold">{stats?.hired || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
