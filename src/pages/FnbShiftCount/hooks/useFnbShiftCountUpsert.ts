import fnbShiftCountApis, {
  type IFnbShiftCountSaveBody,
} from "@/apis/fnbShiftCount.apis";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fnbShiftCountQueryKey } from "./useFnbShiftCount";

interface SaveShiftCountVariables {
  date: string;
  staffId?: string;
  body: IFnbShiftCountSaveBody;
}

export const useFnbShiftCountUpsert = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ date, staffId, body }: SaveShiftCountVariables) =>
      fnbShiftCountApis.saveShiftCount({ date, staffId }, body),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: fnbShiftCountQueryKey.detail({
          date: variables.date,
          staffId: variables.staffId,
        }),
      });
      queryClient.invalidateQueries({
        queryKey: ["fnbShiftCountHistory"],
      });
      toast({
        title: "Đã lưu",
        description: "Kiểm kê FNB đã được cập nhật.",
      });
      return response.data.result;
    },
  });
};
