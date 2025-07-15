import { FnbMenu } from "@/@types/FnBMenu";
import fnbMenuApis from "@/apis/fnbMenu.apis";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetAllMenus = () => {
  return useQuery({
    queryKey: ["fnbMenus"],
    queryFn: async () => {
      const response = await fnbMenuApis.getAllMenus();
      console.log("API Response:", response);
      return response;
    },
    select: (data) => {
      console.log("Selected data:", data.data.result);
      return data.data.result;
    },
    staleTime: 60 * 1000, // Giảm xuống 1 phút
    refetchOnWindowFocus: true,
  });
};

export const useGetMenuById = (id: string) => {
  return useQuery({
    queryKey: ["fnbMenu", id],
    queryFn: () => fnbMenuApis.getMenuById(id),
    enabled: !!id,
  });
};

export const useCreateMenu = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (menu: Omit<FnbMenu, "_id">) => fnbMenuApis.createMenu(menu),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Menu item created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["fnbMenus"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create menu item",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateMenu = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, menu }: { id: string; menu: Partial<FnbMenu> }) =>
      fnbMenuApis.updateMenu(id, menu),
    onSuccess: (_, variables) => {
      toast({
        title: "Success",
        description: "Menu item updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["fnbMenus"] });
      queryClient.invalidateQueries({ queryKey: ["fnbMenu", variables.id] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update menu item",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteMenu = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => fnbMenuApis.deleteMenu(id),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Menu item deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["fnbMenus"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete menu item",
        variant: "destructive",
      });
    },
  });
};
