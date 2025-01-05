import { Price } from "@/@types/general-management";
import Header from "@/components/Layout/Header";
import DeletePricingModal from "@/components/modules/Pricing/DeletePricingModal";
import {
  default as UpdatePricingModal,
  default as UpsertPricingModal,
} from "@/components/modules/Pricing/UpsertPriceModal";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { useGetPricingLists } from "@/hooks/pricing";
import { formatCurrency } from "@/utils";
import { ColumnDef } from "@tanstack/react-table";
import { PencilIcon } from "lucide-react";

function PricePage() {
  const { data, isLoading } = useGetPricingLists();

  const columns: ColumnDef<Price>[] = [
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
    {
      header: "Day type",
      accessorKey: "day_type",
    },
    {
      header: "Prices",
      accessorKey: "prices",
      cell: ({ row }) => {
        return row.original.prices
          .map((price) => `${price.room_type}: ${formatCurrency(price.price)}`)
          .join(", ");
      },
    },
    {
      header: "Time Range",
      accessorKey: "timeRange",
      cell: ({ row }) => {
        const timeRange = row.original.time_range;
        return `${timeRange?.start} - ${timeRange?.end}`;
      },
    },
    {
      header: "Note",
      accessorKey: "note",
    },
    {
      header: "",
      accessorKey: "price",
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-2">
          <UpdatePricingModal
            id={row.original._id}
            icon={<PencilIcon size={12} />}
          />
          <DeletePricingModal id={row.original._id} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <Header title="Pricing" subtitle="List of pricing" />

      <UpsertPricingModal />

      <DataTable
        rowKey="_id"
        loading={isLoading}
        data={data?.data.result || []}
        columns={columns}
        scroll={{
          y: 750,
        }}
      />
    </div>
  );
}

export default PricePage;
