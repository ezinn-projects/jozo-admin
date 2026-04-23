import { ListGamesQuery, ListGameTypesQuery } from "@/@types/Game";
import gameApis from "@/apis/game.apis";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const gameQueryKeys = {
  all: ["games"] as const,
  list: (query?: ListGamesQuery) => ["games", "list", query ?? {}] as const,
  detail: (id: string) => ["games", "detail", id] as const,
  typesAll: ["game-types"] as const,
  typesList: (query?: ListGameTypesQuery) =>
    ["game-types", "list", query ?? {}] as const,
  typeDetail: (id: string) => ["game-types", "detail", id] as const,
};

export const useGetGameTypes = (query?: ListGameTypesQuery) => {
  return useQuery({
    queryKey: gameQueryKeys.typesList(query),
    queryFn: async () => {
      const response = await gameApis.getGameTypes(query);
      return response.data.result || [];
    },
  });
};

export const useGetGameTypeById = (id: string) => {
  return useQuery({
    queryKey: gameQueryKeys.typeDetail(id),
    queryFn: async () => {
      const response = await gameApis.getGameTypeById(id);
      return response.data.result;
    },
    enabled: Boolean(id),
  });
};

export const useCreateGameType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (formData: FormData) => gameApis.createGameType(formData),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã tạo loại game",
      });
      queryClient.invalidateQueries({ queryKey: gameQueryKeys.typesAll });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo loại game",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateGameType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      gameApis.updateGameType(id, formData),
    onSuccess: (_, variables) => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật loại game",
      });
      queryClient.invalidateQueries({ queryKey: gameQueryKeys.typesAll });
      queryClient.invalidateQueries({
        queryKey: gameQueryKeys.typeDetail(variables.id),
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật loại game",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteGameType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => gameApis.deleteGameType(id),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa loại game",
      });
      queryClient.invalidateQueries({ queryKey: gameQueryKeys.typesAll });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa loại game",
        variant: "destructive",
      });
    },
  });
};

export const useGetGames = (query?: ListGamesQuery) => {
  return useQuery({
    queryKey: gameQueryKeys.list(query),
    queryFn: async () => {
      const response = await gameApis.getGames(query);
      return response.data.result || [];
    },
  });
};

export const useGetGameById = (id: string) => {
  return useQuery({
    queryKey: gameQueryKeys.detail(id),
    queryFn: async () => {
      const response = await gameApis.getGameById(id);
      return response.data.result;
    },
    enabled: Boolean(id),
  });
};

export const useCreateGame = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (formData: FormData) => gameApis.createGame(formData),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã tạo game",
      });
      queryClient.invalidateQueries({ queryKey: gameQueryKeys.all });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo game",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateGame = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      gameApis.updateGame(id, formData),
    onSuccess: (_, variables) => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật game",
      });
      queryClient.invalidateQueries({ queryKey: gameQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: gameQueryKeys.detail(variables.id),
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật game",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteGame = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => gameApis.deleteGame(id),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa game",
      });
      queryClient.invalidateQueries({ queryKey: gameQueryKeys.all });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa game",
        variant: "destructive",
      });
    },
  });
};
