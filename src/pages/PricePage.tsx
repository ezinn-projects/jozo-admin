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
      id: "day_type",
      header: "Day type",
      accessorKey: "day_type",
      enableMultiSort: false,
    },
    {
      id: "prices",
      header: "Prices",
      enableMultiSort: false,
      columns: [
        {
          header: "Small Room",
          accessorKey: "small_room",
          cell: ({ row }) => {
            const prices = row.original.time_slots.map((slot) => {
              const price = slot.prices.find((p) => p.room_type === "small");
              return `${slot.start}-${slot.end}: ${formatCurrency(
                price?.price || 0
              )}`;
            });
            return (
              <div className="flex flex-col gap-1">
                {prices.map((price, index) => (
                  <div key={index}>{price}</div>
                ))}
              </div>
            );
          },
        },
        {
          header: "Medium Room",
          accessorKey: "medium_room",
          cell: ({ row }) => {
            const prices = row.original.time_slots.map((slot) => {
              const price = slot.prices.find((p) => p.room_type === "medium");
              return `${slot.start}-${slot.end}: ${formatCurrency(
                price?.price || 0
              )}`;
            });
            return (
              <div className="flex flex-col gap-1">
                {prices.map((price, index) => (
                  <div key={index}>{price}</div>
                ))}
              </div>
            );
          },
        },
        {
          header: "Large Room",
          accessorKey: "large_room",
          cell: ({ row }) => {
            const prices = row.original.time_slots.map((slot) => {
              const price = slot.prices.find((p) => p.room_type === "large");
              return `${slot.start}-${slot.end}: ${formatCurrency(
                price?.price || 0
              )}`;
            });
            return (
              <div className="flex flex-col gap-1">
                {prices.map((price, index) => (
                  <div key={index}>{price}</div>
                ))}
              </div>
            );
          },
        },
      ],
    },
    {
      id: "note",
      header: "Note",
      accessorKey: "note",
      enableMultiSort: false,
    },
    {
      id: "actions",
      header: "",
      accessorKey: "price",
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-2">
          <UpdatePricingModal
            id={row.original._id}
            icon={<PencilIcon size={12} />}
            defaultOpen={true}
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
      <Header title="Pricing" subtitle="List of pricing" />

      <UpsertPricingModal />

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
