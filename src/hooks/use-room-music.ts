import roomsMusicApis from "@/apis/roomMusic.apis";
import { useQuery } from "@tanstack/react-query";
import { Song } from "@/@types/RoomMusic";

export const useSongsCollection = () =>
  useQuery<Song[]>({
    queryKey: ["songs-collection"],
    queryFn: async () => {
      const response = await roomsMusicApis.getSongsCollection();
      return response.data.result || [];
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

export default useSongsCollection;
