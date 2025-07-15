import { FnbMenu } from "@/@types/FnBMenu";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useDeleteMenu, useGetAllMenus } from "@/hooks/use-fnb-menu";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { FnbModal } from "./components/FnbModal";
import { createColumns } from "./components/columns";

const FnBPage = () => {
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<FnbMenu | null>(null);

  const { data: menus, refetch, isLoading, error } = useGetAllMenus();

  const { mutate: deleteMenu } = useDeleteMenu();

  // Debug: Log data when it changes
  useEffect(() => {
    console.log("FnB Menus Data:", menus);
    console.log("Number of items:", menus?.length);
    if (menus) {
      const laysItems = menus.filter((item) =>
        item.name.toLowerCase().includes("lay")
      );
      console.log("Lays items found:", laysItems);
    }
  }, [menus]);

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
        <div className="flex items-center gap-4">
          {isLoading && (
            <span className="text-sm text-muted-foreground">Loading...</span>
          )}
          {error && (
            <span className="text-sm text-red-500">Error loading data</span>
          )}
          <span className="text-sm text-muted-foreground">
            Total items: {menus?.length || 0}
          </span>
          <Button onClick={() => refetch()}>Refresh</Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Menu Item
          </Button>
        </div>
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
