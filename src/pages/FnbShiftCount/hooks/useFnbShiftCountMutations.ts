import fnbShiftCountApis, {
  type IFnbShiftCountGetParams,
  type IFnbShiftCountResponse,
  type IFnbShiftCountSaveDayItemsBody,
  type IFnbShiftCountSaveShiftBody,
  type ShiftNo,
} from "@/apis/fnbShiftCount.apis";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fnbShiftCountQueryKey } from "./useFnbShiftCount";

const updateShiftCountCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  date: string | undefined,
  result: IFnbShiftCountResponse,
) => {
  queryClient.setQueryData(
    fnbShiftCountQueryKey.detail(date),
    (
      old: Awaited<ReturnType<typeof fnbShiftCountApis.getShiftCount>> | undefined,
    ) => {
      if (!old) return old;
      return {
        ...old,
        data: {
          ...old.data,
          result,
        },
      };
    },
  );
  queryClient.invalidateQueries({
    queryKey: ["fnbShiftCountHistory"],
  });
};

export const useFnbShiftCountSaveShift = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      shiftNo,
      date,
      body,
    }: {
      shiftNo: ShiftNo;
      date?: string;
      body: IFnbShiftCountSaveShiftBody;
    }) => {
      const params: IFnbShiftCountGetParams | undefined = date
        ? { date }
        : undefined;
      return fnbShiftCountApis.saveShift(shiftNo, body, params);
    },
    onSuccess: (response, variables) => {
      const result = response.data.result;
      if (!result) return;
      updateShiftCountCache(queryClient, variables.date, result);
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast({
        title: "Không thể lưu ca",
        description:
          error.response?.data?.message || "Vui lòng kiểm tra lại dữ liệu.",
        variant: "destructive",
      });
    },
  });
};

export const useFnbShiftCountSaveDayItems = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      date,
      body,
    }: {
      date?: string;
      body: IFnbShiftCountSaveDayItemsBody;
    }) => {
      const params: IFnbShiftCountGetParams | undefined = date
        ? { date }
        : undefined;
      return fnbShiftCountApis.saveDayItems(body, params);
    },
    onSuccess: (response, variables) => {
      const result = response.data.result;
      if (!result) return;
      updateShiftCountCache(queryClient, variables.date, result);
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast({
        title: "Không thể lưu",
        description:
          error.response?.data?.message || "Vui lòng kiểm tra lại dữ liệu.",
        variant: "destructive",
      });
    },
  });
};

export const useFnbShiftCountLockShift = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      shiftNo,
      date,
    }: {
      shiftNo: ShiftNo;
      date?: string;
    }) => {
      const params: IFnbShiftCountGetParams | undefined = date
        ? { date }
        : undefined;
      return fnbShiftCountApis.lockShift(shiftNo, params);
    },
    onSuccess: (response, variables) => {
      const result = response.data.result;
      if (!result) return;
      updateShiftCountCache(queryClient, variables.date, result);
      toast({
        title: "Đã khóa ca",
        description: `${variables.shiftNo} đã được khóa.`,
      });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast({
        title: "Không thể khóa ca",
        description:
          error.response?.data?.message || "Vui lòng kiểm tra lại điều kiện.",
        variant: "destructive",
      });
    },
  });
};

export const useFnbShiftCountUnlockShift = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      shiftNo,
      date,
    }: {
      shiftNo: ShiftNo;
      date?: string;
    }) => {
      const params: IFnbShiftCountGetParams | undefined = date
        ? { date }
        : undefined;
      return fnbShiftCountApis.unlockShift(shiftNo, params);
    },
    onSuccess: (response, variables) => {
      const result = response.data.result;
      if (!result) return;
      updateShiftCountCache(queryClient, variables.date, result);
      toast({
        title: "Đã mở khóa ca",
        description: `Ca ${variables.shiftNo} đã được mở khóa.`,
      });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast({
        title: "Không thể mở khóa ca",
        description:
          error.response?.data?.message || "Bạn không có quyền thực hiện.",
        variant: "destructive",
      });
    },
  });
};
