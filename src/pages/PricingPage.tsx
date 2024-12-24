import Header from "@/components/Layout/Header";
import DeletePricingModal from "@/components/modules/Pricing/DeletePricingModal";
import {
  default as UpdatePricingModal,
  default as UpsertPricingModal,
} from "@/components/modules/Pricing/UpsertPricingModal";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { useGetPricingLists } from "@/hooks/pricing";
import { ColumnDef } from "@tanstack/react-table";
import { PencilIcon } from "lucide-react";

function PricingPage() {
  const { data, isLoading } = useGetPricingLists();

  const columns: ColumnDef<Pricing>[] = [
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
      header: "Room Size",
      accessorKey: "room_size",
    },
    {
      header: "Day Type",
      accessorKey: "day_type",
    },
    {
      header: "Price",
      accessorKey: "price",
    },
    {
      header: "Time Range",
      accessorKey: "time_range",
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

export default PricingPage;
