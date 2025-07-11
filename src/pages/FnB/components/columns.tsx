import { FnbMenu } from "@/@types/FnBMenu";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/formatters";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";

interface ColumnActions {
  onEdit: (menu: FnbMenu) => void;
  onDelete: (id: string) => void;
}

export const createColumns = ({
  onEdit,
  onDelete,
}: ColumnActions): ColumnDef<FnbMenu>[] => [
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => {
      const image = row.getValue("image") as string;
      return image ? (
        <div className="relative w-16 h-16">
          <img
            src={image}
            alt={row.getValue("name")}
            className="object-cover w-full h-full rounded-md"
          />
        </div>
      ) : (
        <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
          No image
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => formatCurrency(row.getValue("price")),
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const menu = row.original;

      console.log("menu", menu);

      return (
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(menu)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(menu._id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
