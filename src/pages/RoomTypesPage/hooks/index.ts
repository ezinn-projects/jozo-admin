import roomTypeApis from "@/apis/roomType.apis";
import { useMutation, useQuery } from "@tanstack/react-query";

/**
 * @description get room types lists
 * @returns @type {HTTPResponse<RoomTypeResponse>}
 * @author QuangDoo
 */
function useRoomTypesLists() {
  const queryData = useQuery({
    queryKey: ["room-types-lists"],
    queryFn: roomTypeApis.getRoomTypesLists,
  });

  return { ...queryData };
}

/**
 * @description add room type
 * @param {name:string, description: string} payload
 * @returns @type {HTTPResponse<RoomType>}
 * @author QuangDoo
 */
function useAddRoomType() {
  const mutation = useMutation({
    mutationFn: roomTypeApis.addRoomType,
  });

  return { ...mutation };
}

/**
 * @description update room type
 * @param {name:string, description: string} payload
 * @returns @type {HTTPResponse<RoomType>}
 * @author QuangDoo
 */
function useUpdateRoomType() {
  const mutation = useMutation({
    mutationFn: roomTypeApis.updateRoomType,
  });

  return { ...mutation };
}

/**
 * @description delete room type
 * @param {_id: string} payload
 * @returns @type {HTTPResponse<RoomType>}
 * @author QuangDoo
 */
function useDeleteRoomType() {
  const mutation = useMutation({
    mutationFn: roomTypeApis.deleteRoomType,
  });

  return { ...mutation };
}

export {
  useAddRoomType,
  useDeleteRoomType,
  useRoomTypesLists,
  useUpdateRoomType,
};
