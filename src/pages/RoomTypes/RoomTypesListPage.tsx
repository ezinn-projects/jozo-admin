import { IRoomType } from "@/@types/RoomType";
import roomTypeApis from "@/apis/roomType.apis";
import Header from "@/components/Layout/Header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { DeleteModal } from "@/components/shared/DeleteModal";
import PATHS from "@/constants/paths";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { PencilIcon, TrashIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { formatCurrency } from "@/utils";

function RoomTypesListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["roomTypes"],
    queryFn: () => roomTypeApis.getRoomTypes(),
  });

  const [selectedRoomType, setSelectedRoomType] = useState<IRoomType | null>(
    null
  );
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteRoomTypeMutation = useMutation({
    mutationFn: (roomTypeId: string) =>
      roomTypeApis.deleteRoomType({ _id: roomTypeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roomTypes"] });
      toast({
        title: "Xóa loại phòng thành công",
        description: "Loại phòng đã được xóa thành công",
      });
      setSelectedRoomType(null);
    },
    onError: () => {
      toast({
        title: "Có lỗi xảy ra khi xóa loại phòng",
        variant: "destructive",
      });
    },
  });

  console.log("data", data?.data.result);

  const columns: ColumnDef<IRoomType>[] = [
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
      id: "name",
      header: "Name",
      accessorKey: "name",
    },
    {
      id: "type",
      header: "Type",
      accessorKey: "type",
    },
    {
      id: "capacity",
      header: "Capacity",
      accessorKey: "capacity",
    },
    {
      id: "area",
      header: "Area (m²)",
      accessorKey: "area",
    },
    {
      id: "prices",
      header: "Prices",
      columns: [
        {
          header: "Morning (10:00-14:00)",
          cell: ({ row }) => {
            const price = row.original.prices.find(
              (p) => p.timeSlot === "10:00-14:00"
            );
            return formatCurrency(price?.price || 0);
          },
        },
        {
          header: "Afternoon (14:00-17:00)",
          cell: ({ row }) => {
            const price = row.original.prices.find(
              (p) => p.timeSlot === "14:00-17:00"
            );
            return formatCurrency(price?.price || 0);
          },
        },
        {
          header: "Evening (17:00-23:59)",
          cell: ({ row }) => {
            const price = row.original.prices.find(
              (p) => p.timeSlot === "17:00-23:59"
            );
            return formatCurrency(price?.price || 0);
          },
        },
      ],
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-2">
          <Link to={`${PATHS.ROOM_TYPES_LISTS}/${row.original._id}`}>
            <Button variant="ghost" size="icon">
              <PencilIcon size={16} />
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedRoomType(row.original)}
          >
            <TrashIcon size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Header title="Room Types" subtitle="List of room types" />

      <Link to={PATHS.ROOM_TYPES_NEW}>
        <Button className="mt-3 mb-4">New room type</Button>
      </Link>

      <DataTable
        rowKey="_id"
        loading={isLoading}
        data={data?.data.result || []}
        columns={columns}
        scroll={{
          y: 750,
        }}
      />

      <DeleteModal
        isOpen={!!selectedRoomType}
        onClose={() => setSelectedRoomType(null)}
        onConfirm={() => {
          if (selectedRoomType) {
            deleteRoomTypeMutation.mutate(selectedRoomType._id as string);
          }
        }}
        title="Xóa loại phòng"
        description={`Bạn có chắc chắn muốn xóa loại phòng "${selectedRoomType?.name}"?`}
        isLoading={deleteRoomTypeMutation.isPending}
      />
    </div>
  );
}

export default RoomTypesListPage;
