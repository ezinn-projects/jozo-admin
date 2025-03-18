import { Price } from "@/@types/general-management";
import Header from "@/components/Layout/Header";
import {
  default as UpdatePricingModal,
  default as UpsertPricingModal,
} from "@/components/modules/Pricing/UpsertPriceModal";
import { DeleteModal } from "@/components/shared/DeleteModal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { useDeletePricing, useGetPricingLists } from "@/hooks/pricing";
import { formatCurrency } from "@/utils";
import { ColumnDef } from "@tanstack/react-table";
import { PencilIcon, TrashIcon } from "lucide-react";
import { useState } from "react";

function PricePage() {
  const [selectedPricing, setSelectedPricing] = useState<Price | null>(null);

  const { data, isLoading, refetch } = useGetPricingLists();
  const { mutate: deletePricing } = useDeletePricing();

  const columns: ColumnDef<Price>[] = [
    // Cột checkbox để chọn hàng
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    // Cột Day type
    {
      id: "day_type",
      header: "Day type",
      accessorKey: "day_type",
      enableMultiSort: false,
    },
    // Cột Prices (chỉ hiển thị 1 cột thay vì 3 cột)
    {
      id: "prices",
      header: "Prices",
      enableMultiSort: false,
      cell: ({ row }) => {
        const timeSlots = row.original.time_slots; // Mảng time_slots

        return (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-1 text-left">Time</th>
                <th className="p-1 text-left">Small</th>
                <th className="p-1 text-left">Medium</th>
                <th className="p-1 text-left">Large</th>
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot, idx) => {
                const smallPrice =
                  slot.prices.find((p) => p.room_type === "small")?.price || 0;
                const mediumPrice =
                  slot.prices.find((p) => p.room_type === "medium")?.price || 0;
                const largePrice =
                  slot.prices.find((p) => p.room_type === "large")?.price || 0;

                return (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="p-1">
                      {slot.start} - {slot.end}
                    </td>
                    <td className="p-1">{formatCurrency(smallPrice)}</td>
                    <td className="p-1">{formatCurrency(mediumPrice)}</td>
                    <td className="p-1">{formatCurrency(largePrice)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        );
      },
    },
    // Cột Note
    {
      id: "note",
      header: "Note",
      accessorKey: "note",
      enableMultiSort: false,
    },
    // Cột hành động (Sửa/Xoá)
    {
      id: "actions",
      header: "",
      accessorKey: "price",
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-2">
          <UpdatePricingModal
            id={row.original._id}
            icon={<PencilIcon size={12} />}
            defaultOpen={false}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedPricing(row.original)}
          >
            <TrashIcon size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <Header title="Pricing" subtitle="List of pricing" />

      {/* Nút thêm giá mới (nếu cần) */}
      <UpsertPricingModal />

      {/* Modal xóa giá */}
      <DeleteModal
        title="Delete pricing"
        description="Are you sure you want to delete this pricing?"
        isOpen={!!selectedPricing}
        onClose={() => setSelectedPricing(null)}
        onConfirm={() => {
          deletePricing(
            { _id: selectedPricing?._id || "" },
            {
              onSuccess: () => {
                setSelectedPricing(null);
                refetch();
              },
            }
          );
        }}
      />

      {/* Bọc DataTable trong div overflow-x-auto để hỗ trợ cuộn ngang khi cần */}
      <div className="overflow-x-auto">
        <DataTable
          rowKey="_id"
          loading={isLoading}
          data={data?.data.result || []}
          columns={columns}
          // Tuỳ chọn scroll nếu bạn muốn cố định chiều cao
          scroll={{ y: 750 }}
        />
      </div>
    </div>
  );
}

export default PricePage;
