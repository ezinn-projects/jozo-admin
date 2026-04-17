import roomTypeApis from "@/apis/roomType.apis";
import { useQuery } from "@tanstack/react-query";

export const useGetRoomTypes = () => {
  return useQuery({
    queryKey: ["roomTypes"],
    queryFn: () => roomTypeApis.getRoomTypes(),
  });
};
