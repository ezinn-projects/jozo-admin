import React, { useState } from "react";
import { useRecruitments, useRecruitmentStats } from "@/hooks/use-recruitment";
import StatsCards from "./components/StatsCards";
import FiltersContainer from "./components/FiltersContainer";
import DataTableContainer from "./components/DataTableContainer";
import PaginationContainer from "./components/PaginationContainer";
import RefreshButton from "./components/RefreshButton";

const RecruitmentPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const {
    data: recruitmentData,
    isLoading,
    error,
    refetch: refetchRecruitments,
  } = useRecruitments(currentPage, pageSize, searchTerm || undefined);

  const { data: stats, refetch: refetchStats } = useRecruitmentStats();

  // Lấy data và pagination info từ response
  const recruitments = recruitmentData?.data || [];
  const pagination = recruitmentData?.pagination;

  // Filter theo status (client-side vì backend chưa hỗ trợ)
  const filteredRecruitments = recruitments.filter((recruitment) => {
    const matchesStatus =
      statusFilter === "all" || recruitment.status === statusFilter;
    return matchesStatus;
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset về trang đầu tiên khi thay đổi page size
  };

  // Reset về trang 1 khi search thay đổi
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleRefresh = () => {
    refetchRecruitments();
    refetchStats();
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Có lỗi xảy ra khi tải dữ liệu</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý tuyển dụng</h1>
          <p className="text-gray-600">Quản lý danh sách ứng viên tuyển dụng</p>
        </div>
        <RefreshButton onRefresh={handleRefresh} isLoading={isLoading} />
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Filters */}
      <FiltersContainer
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {/* Data Table */}
      <DataTableContainer
        data={filteredRecruitments}
        loading={isLoading}
        total={pagination?.total || 0}
      />

      {/* Pagination */}
      {pagination && (
        <PaginationContainer
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          pageSize={pageSize}
          total={pagination.total}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
};

export default RecruitmentPage;
