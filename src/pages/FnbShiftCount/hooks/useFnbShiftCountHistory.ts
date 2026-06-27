import fnbShiftCountApis, {
  type IFnbShiftCountHistoryParams,
} from "@/apis/fnbShiftCount.apis";
import { useQuery } from "@tanstack/react-query";
import { fnbShiftCountQueryKey } from "./useFnbShiftCount";

export const useFnbShiftCountHistory = (
  params: IFnbShiftCountHistoryParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: fnbShiftCountQueryKey.history(params),
    queryFn: () => fnbShiftCountApis.getHistory(params),
    enabled,
    select: (response) => response.data.result,
  });
};
