import fnbShiftCountApis, {
  type IFnbShiftCountGetParams,
  type IFnbShiftCountHistoryParams,
} from "@/apis/fnbShiftCount.apis";
import { useQuery } from "@tanstack/react-query";

export const fnbShiftCountQueryKey = {
  detail: (date?: string) => ["fnbShiftCount", date ?? "today"] as const,
  template: () => ["fnbShiftCountTemplate"] as const,
  history: (params: IFnbShiftCountHistoryParams) =>
    ["fnbShiftCountHistory", params] as const,
};

export const useFnbShiftCount = (
  params?: IFnbShiftCountGetParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: fnbShiftCountQueryKey.detail(params?.date),
    queryFn: () => fnbShiftCountApis.getShiftCount(params),
    enabled,
    select: (response) => response.data.result,
    // Dữ liệu ngày được cập nhật qua setQueryData sau mỗi lần lưu — không refetch GET.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

export const useFnbShiftCountItemsTemplate = (enabled = true) => {
  return useQuery({
    queryKey: fnbShiftCountQueryKey.template(),
    queryFn: () => fnbShiftCountApis.getItemsTemplate(),
    enabled,
    staleTime: 5 * 60 * 1000,
    select: (response) => response.data.result ?? [],
  });
};
