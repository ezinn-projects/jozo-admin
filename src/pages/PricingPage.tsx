import Header from "@/components/Layout/Header";
import UpdatePricingModal from "@/components/modules/UpdatePricingModal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { useGetPricingLists } from "@/hooks/pricing";
import { ColumnDef } from "@tanstack/react-table";

function PricingPage() {
  const { data, isLoading } = useGetPricingLists();

  console.log(data);

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
    { header: "Price", accessorKey: "price" },
    {
      header: "",
      accessorKey: "price",
      cell: ({ row }) => <Button>Edit</Button>,
    },
  ];

  return (
    <div>
      <Header title="Pricing" subtitle="List of pricing" />

      <UpdatePricingModal />

      <DataTable
        className="mt-4"
        loading={isLoading}
        data={data?.data.result || []}
        columns={columns}
      />
    </div>
  );
}

export default PricingPage;
