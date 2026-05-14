import roomsMusicApis, {
  type PruneUnavailableYoutubeParams,
} from "@/apis/roomMusic.apis";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useSongsCollection = (params?: {
  page?: number;
  limit?: number;
  keyword?: string;
}) =>
  useQuery({
    queryKey: [
      "songs-collection",
      params?.page,
      params?.limit,
      params?.keyword,
    ],
    queryFn: async () => {
      const response = await roomsMusicApis.getSongsCollection(params);
      return response.data;
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

export const useNormalizeSongs = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => roomsMusicApis.normalizeSongs(),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã chuẩn hóa dữ liệu bài hát",
      });
      queryClient.invalidateQueries({ queryKey: ["songs-collection"] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể chuẩn hóa dữ liệu bài hát",
        variant: "destructive",
      });
    },
  });
};

export const usePruneUnavailableYoutube = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params?: PruneUnavailableYoutubeParams) =>
      roomsMusicApis.pruneUnavailableYoutube(params),
    onSuccess: (_response, variables) => {
      if (!variables?.dryRun) {
        queryClient.invalidateQueries({ queryKey: ["songs-collection"] });
      }
    },
  });
};

export const useDeleteSong = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (videoId: string) => roomsMusicApis.deleteSong(videoId),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa bài hát khỏi collection",
      });
      queryClient.invalidateQueries({ queryKey: ["songs-collection"] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa bài hát",
        variant: "destructive",
      });
    },
  });
};

export default useSongsCollection;
