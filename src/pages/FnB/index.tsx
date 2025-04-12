import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { FnbMenu, FnbFormValues } from "@/@types/FnBMenu";
import { FnbModal } from "./components/FnbModal";
import { createColumns } from "./components/columns";
import { useToast } from "@/hooks/use-toast";

const FnBPage = () => {
  const { toast } = useToast();
  // Mock data
  const [menus, setMenus] = useState<FnbMenu[]>([
    {
      _id: "1",
      name: "Pizza",
      price: 10.99,
      description: "Delicious pizza with cheese and toppings",
      image: "https://example.com/pizza.jpg",
      category: "food",
      createdAt: new Date(),
    },
    {
      _id: "2",
      name: "Coke",
      price: 2.99,
      description: "Refreshing cola drink",
      image: "https://example.com/coke.jpg",
      category: "beverage",
      createdAt: new Date(),
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<FnbMenu | null>(null);

  const handleCreate = () => {
    setSelectedMenu(null);
    setIsModalOpen(true);
  };

  const handleEdit = (menu: FnbMenu) => {
    setSelectedMenu(menu);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setMenus(menus.filter((menu) => menu._id !== id));
    toast({
      title: "Success",
      description: "Menu item deleted successfully",
    });
  };

  const handleSubmit = (values: FnbFormValues) => {
    if (selectedMenu) {
      // Edit
      setMenus(
        menus.map((menu) =>
          menu._id === selectedMenu._id
            ? {
                ...menu,
                ...values,
                updatedAt: new Date(),
              }
            : menu
        )
      );
      toast({
        title: "Success",
        description: "Menu item updated successfully",
      });
    } else {
      // Create
      const newMenu: FnbMenu = {
        _id: Date.now().toString(),
        ...values,
        image: values.image || "",
        createdAt: new Date(),
      };
      setMenus([...menus, newMenu]);
      toast({
        title: "Success",
        description: "Menu item created successfully",
      });
    }
    setIsModalOpen(false);
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

      <DataTable columns={columns} data={menus} />

      <FnbModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialValues={selectedMenu || undefined}
        mode={selectedMenu ? "edit" : "create"}
      />
    </div>
  );
};

export default FnBPage;
