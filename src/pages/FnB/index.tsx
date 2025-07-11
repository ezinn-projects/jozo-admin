import { FnbMenu } from "@/@types/FnBMenu";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useDeleteMenu, useGetAllMenus } from "@/hooks/use-fnb-menu";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { useState } from "react";
import { FnbModal } from "./components/FnbModal";
import { createColumns } from "./components/columns";

const FnBPage = () => {
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<FnbMenu | null>(null);

  const { data: menus, refetch } = useGetAllMenus();

  const { mutate: deleteMenu } = useDeleteMenu();

  const handleCreate = () => {
    setSelectedMenu(null);
    setIsModalOpen(true);
  };

  const handleEdit = (menu: FnbMenu) => {
    setSelectedMenu(menu);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMenu(id, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Menu item deleted successfully",
        });
        refetch();
      },
    });
  };

  const columns = createColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight">
          Food & Beverage Menu
        </h2>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Menu Item
        </Button>
      </div>

      <DataTable columns={columns} data={menus || []} />

      <FnbModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialValues={selectedMenu || undefined}
      />
    </div>
  );
};

export default FnBPage;
