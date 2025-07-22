import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import fnbMenuApis from "@/apis/fnbMenu.apis";
import fnbOrderApis, {
  ICompleteOrderRequestBody,
  ICompleteOrderResult,
} from "@/apis/fnbOrder.apis";
import { FnBCategory } from "@/constants/enum";

// Interface cho menu item theo cấu trúc cũ (để tương thích)
export interface FnBMenuItem {
  _id?: string;
  name: string;
  category: FnBCategory;
  parentId: string | null;
  hasVariant: boolean;
  price: number;
  image?: string;
  isAvailable?: boolean;
  inventory: {
    quantity: number;
    minStock?: number;
    maxStock?: number;
    lastUpdated: Date;
  };
  parent?: FnBMenuItem; // Thông tin parent item
  variants?: FnBMenuItem[]; // Danh sách variants
}

// Interface cho menu item theo cấu trúc mới
export interface MenuItemVariant {
  name: string;
  price: number;
  image: string;
  inventory: {
    quantity: number;
    minStock?: number;
    maxStock?: number;
  };
}

export interface MenuItem {
  _id: string;
  name: string;
  parentId: string | null;
  hasVariant: boolean;
  price: number;
  image: string;
  category: string;
  inventory: {
    quantity: number;
    minStock?: number;
    maxStock?: number;
    lastUpdated?: string;
  };
  createdAt: string;
  updatedAt: string;
  existingImage?: string;
  quantity?: string;
  variants?: string; // JSON string của variants
}

interface CreateMenuItemData {
  name: string;
  category: FnBCategory;
  parentId: string | null;
  hasVariant: boolean;
  price: number;
  quantity: number;
  image?: File;
}

interface UpdateMenuItemData extends Partial<CreateMenuItemData> {
  _id: string;
}

// Query keys
const menuItemsKeys = {
  all: ["menuItems"] as const,
  lists: () => [...menuItemsKeys.all, "list"] as const,
  list: (filters: string) => [...menuItemsKeys.lists(), { filters }] as const,
  details: () => [...menuItemsKeys.all, "detail"] as const,
  detail: (id: string) => [...menuItemsKeys.details(), id] as const,
};

// API functions using fnbMenuApis
const fetchMenuItems = async (): Promise<FnBMenuItem[]> => {
  const response = await fnbMenuApis.getAllMenuItems();
  return response.data.result || [];
};

const createMenuItem = async (formData: FormData): Promise<FnBMenuItem> => {
  const response = await fnbMenuApis.createMenuItem(formData);
  return response.data;
};

const updateMenuItem = async ({
  _id,
  ...data
}: UpdateMenuItemData): Promise<FnBMenuItem> => {
  const formData = new FormData();

  // Append all fields to FormData
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (key === "image" && value instanceof File) {
        formData.append(key, value);
      } else if (typeof value === "object") {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    }
  });

  const response = await fnbMenuApis.updateMenuItem(_id, formData);
  if (!response.data) {
    throw new Error("Failed to update menu item");
  }
  return response.data;
};

const deleteMenuItem = async (itemId: string): Promise<void> => {
  await fnbMenuApis.deleteMenuItem(itemId);
};

// Hook cũ (để tương thích)
export const useMenuItems = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query: Fetch all menu items with better caching
  const {
    data: menuItems = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: menuItemsKeys.lists(),
    queryFn: fetchMenuItems,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Mutation: Create menu item with optimistic updates
  const createMutation = useMutation({
    mutationFn: createMenuItem,
    onMutate: async (newMenuItem) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: menuItemsKeys.lists() });

      // Snapshot the previous value
      const previousMenuItems = queryClient.getQueryData(menuItemsKeys.lists());

      // Optimistically update to the new value
      queryClient.setQueryData(
        menuItemsKeys.lists(),
        (old: FnBMenuItem[] = []) => [
          ...old,
          {
            _id: "temp-id-" + Date.now(),
            name: newMenuItem.get("name") as string,
            category:
              (newMenuItem.get("category") as FnBCategory) || FnBCategory.SNACK,
            parentId: (newMenuItem.get("parentId") as string) || null,
            hasVariant: newMenuItem.get("hasVariant") === "true",
            price: Number(newMenuItem.get("price")),
            inventory: {
              quantity: Number(newMenuItem.get("quantity")),
              lastUpdated: new Date(),
            },
          } as FnBMenuItem,
        ]
      );

      // Return a context object with the snapshotted value
      return { previousMenuItems };
    },
    onError: (err, _newMenuItem, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousMenuItems) {
        queryClient.setQueryData(
          menuItemsKeys.lists(),
          context.previousMenuItems
        );
      }
      console.error("Error creating menu item:", err);
      toast({
        title: "Lỗi",
        description: err.message || "Không thể tạo menu item",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: menuItemsKeys.lists() });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã tạo menu item mới",
      });
    },
  });

  // Mutation: Update menu item with optimistic updates
  const updateMutation = useMutation({
    mutationFn: updateMenuItem,
    onMutate: async ({ _id, ...updatedData }) => {
      await queryClient.cancelQueries({ queryKey: menuItemsKeys.lists() });

      const previousMenuItems = queryClient.getQueryData(menuItemsKeys.lists());

      queryClient.setQueryData(
        menuItemsKeys.lists(),
        (old: FnBMenuItem[] = []) =>
          old.map((item) =>
            item._id === _id ? { ...item, ...updatedData } : item
          )
      );

      return { previousMenuItems };
    },
    onError: (err, _variables, context) => {
      if (context?.previousMenuItems) {
        queryClient.setQueryData(
          menuItemsKeys.lists(),
          context.previousMenuItems
        );
      }
      console.error("Error updating menu item:", err);
      toast({
        title: "Lỗi",
        description: err.message || "Không thể cập nhật menu item",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: menuItemsKeys.lists() });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật menu item",
      });
    },
  });

  // Mutation: Delete menu item with optimistic updates
  const deleteMutation = useMutation({
    mutationFn: deleteMenuItem,
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: menuItemsKeys.lists() });

      const previousMenuItems = queryClient.getQueryData(menuItemsKeys.lists());

      queryClient.setQueryData(
        menuItemsKeys.lists(),
        (old: FnBMenuItem[] = []) => old.filter((item) => item._id !== itemId)
      );

      return { previousMenuItems };
    },
    onError: (err, variables, context) => {
      if (context?.previousMenuItems) {
        queryClient.setQueryData(
          menuItemsKeys.lists(),
          context.previousMenuItems
        );
      }
      console.error("Error deleting menu item:", err);
      toast({
        title: "Lỗi",
        description: err.message || "Không thể xóa menu item",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: menuItemsKeys.lists() });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa menu item",
      });
    },
  });

  // Helper functions
  const createMenuItemWithFormData = (data: CreateMenuItemData) => {
    const formData = new FormData();

    // Required fields
    formData.append("name", data.name);
    formData.append("price", data.price.toString());
    formData.append("hasVariant", data.hasVariant.toString());
    formData.append("quantity", data.quantity.toString());

    // Optional fields
    if (data.parentId) {
      formData.append("parentId", data.parentId);
    } else {
      formData.append("parentId", "");
    }

    if (data.image) {
      formData.append("image", data.image);
    }

    return createMutation.mutate(formData);
  };

  const updateMenuItemWithFormData = (data: UpdateMenuItemData) => {
    const formData = new FormData();

    // Append all fields to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (key === "_id") return; // Skip _id field
      if (value !== undefined && value !== null) {
        if (key === "image" && value instanceof File) {
          formData.append(key, value);
        } else if (typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    return updateMutation.mutate({
      _id: data._id,
      ...Object.fromEntries(formData),
    });
  };

  // Get parent items (items that can have variants)
  const getParentItems = () => {
    return menuItems.filter((item) => item.hasVariant && !item.parentId);
  };

  // Get variants of a specific parent
  const getVariantsByParentId = (parentId: string) => {
    return menuItems.filter((item) => item.parentId === parentId);
  };

  // Group items by parent (for display purposes)
  const getGroupedItems = () => {
    return menuItems.reduce((acc, item) => {
      if (item.parentId) {
        // This is a variant
        const parent = acc.find((p) => p._id === item.parentId);
        if (parent) {
          if (!parent.variants) parent.variants = [];
          parent.variants.push(item);
        }
      } else {
        // This is a parent item
        acc.push({ ...item, variants: [] });
      }
      return acc;
    }, [] as FnBMenuItem[]);
  };

  return {
    // Data
    menuItems,
    groupedItems: getGroupedItems(),
    parentItems: getParentItems(),

    // Loading states
    isLoading,
    isFetching,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Error
    error,

    // Actions
    createMenuItem: createMenuItemWithFormData,
    updateMenuItem: updateMenuItemWithFormData,
    deleteMenuItem: deleteMutation.mutate,
    refetch,

    // Helper functions
    getVariantsByParentId,
  };
};

// Hook mới cho cấu trúc API mới
export const useGetMenuItems = () => {
  return useQuery({
    queryKey: ["menuItems"],
    queryFn: fnbMenuApis.getAllMenuItems,
    select: (data) => data.data.result as unknown as MenuItem[],
  });
};

export const useGetMenuItemsByCategory = (category: string) => {
  return useQuery({
    queryKey: ["menuItems", category],
    queryFn: () => fnbMenuApis.getAllMenuItems(),
    select: (data) => {
      const allItems = data.data.result as unknown as MenuItem[];
      return allItems.filter((item) => item.category === category);
    },
    enabled: !!category,
  });
};

// Hook cho việc complete order với items
export const useCompleteOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: ICompleteOrderRequestBody) => {
      return fnbOrderApis.completeOrder(payload);
    },
    onSuccess: (response) => {
      const responseData = response.data;

      toast({
        title: "Thành công",
        description:
          responseData.message || "Đã thêm items vào order thành công",
      });

      // Invalidate các queries liên quan đến orders và menu items
      queryClient.invalidateQueries({ queryKey: ["fnbOrders"] });
      queryClient.invalidateQueries({ queryKey: ["roomSchedule"] });
      queryClient.invalidateQueries({ queryKey: menuItemsKeys.lists() });

      // Cập nhật cache cho các menu items đã được cập nhật
      const result = responseData.result as ICompleteOrderResult;
      if (result?.updatedItems) {
        result.updatedItems.forEach((updatedItem) => {
          queryClient.setQueryData(
            menuItemsKeys.detail(updatedItem._id),
            updatedItem
          );
        });
      }
    },
    onError: (error: unknown) => {
      console.error("Error completing order:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không thể thêm items vào order";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};
