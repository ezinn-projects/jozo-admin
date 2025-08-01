import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "../columns";
import { Recruitment } from "@/@types/Recruitment";

interface DataTableContainerProps {
  data: Recruitment[];
  loading: boolean;
  total: number;
}

const DataTableContainer: React.FC<DataTableContainerProps> = ({
  data,
  loading,
  total,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Danh sách ứng viên ({total})</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          emptyMessage="Không tìm thấy ứng viên nào"
          rowKey="_id"
          scroll={{ x: 1800 }}
        />
      </CardContent>
    </Card>
  );
};

export default DataTableContainer;
