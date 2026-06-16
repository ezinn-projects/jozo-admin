import fnbShiftCountApis, {
  type IFnbShiftCountGetParams,
  type IFnbShiftCountHistoryParams,
} from "@/apis/fnbShiftCount.apis";
import { useQuery } from "@tanstack/react-query";

export const fnbShiftCountQueryKey = {
  detail: (params: IFnbShiftCountGetParams) =>
    ["fnbShiftCount", params.date, params.staffId ?? "self"] as const,
  history: (params: IFnbShiftCountHistoryParams) =>
    ["fnbShiftCountHistory", params] as const,
};

export const useFnbShiftCount = (params: IFnbShiftCountGetParams, enabled = true) => {
  return useQuery({
    queryKey: fnbShiftCountQueryKey.detail(params),
    queryFn: () => fnbShiftCountApis.getShiftCount(params),
    enabled: enabled && !!params.date,
    select: (response) => response.data.result,
  });
};
