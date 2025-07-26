import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userApis } from "@/apis/user.apis";
import { UpdateUserRequest } from "@/@types/user";
import { toast } from "@/hooks/use-toast";

export const useUsers = () => {
  const queryClient = useQueryClient();

  // Query để lấy danh sách tất cả users
  const {
    data: usersResponse,
    isLoading: isLoadingUsers,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["users"],
    queryFn: userApis.getAllUsers,
  });

  // Lấy users từ response
  const users = usersResponse?.data?.result?.users || [];

  // Hook để lấy thông tin user theo ID
  const useUserById = (id: string) => {
    return useQuery({
      queryKey: ["user", id],
      queryFn: () => userApis.getUserById(id),
      enabled: !!id,
    });
  };

  // Mutation để tạo user mới
  const createUserMutation = useMutation({
    mutationFn: userApis.createUser,
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Tạo user mới thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : "Có lỗi xảy ra khi tạo user";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Mutation để cập nhật user
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
      userApis.updateUser(id, data),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Cập nhật user thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi cập nhật user";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Mutation để xóa user
  const deleteUserMutation = useMutation({
    mutationFn: userApis.deleteUser,
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Xóa user thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : "Có lỗi xảy ra khi xóa user";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  return {
    users,
    isLoadingUsers,
    usersError,
    refetchUsers,
    useUserById,
    createUser: createUserMutation.mutate,
    updateUser: updateUserMutation.mutate,
    deleteUser: deleteUserMutation.mutate,
    isCreatingUser: createUserMutation.isPending,
    isUpdatingUser: updateUserMutation.isPending,
    isDeletingUser: deleteUserMutation.isPending,
  };
};
