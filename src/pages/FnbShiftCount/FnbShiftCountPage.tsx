import { PageHeader } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsAdmin } from "@/hooks/usePermission";
import dayjs from "@/lib/dayjs";
import { ClipboardList } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ShiftCountFilters from "./components/ShiftCountFilters";
import ShiftCountGrid from "./components/ShiftCountGrid";
import ShiftCountHistoryTable from "./components/ShiftCountHistoryTable";
import ShiftCountSummary from "./components/ShiftCountSummary";
import {
  useFnbShiftCount,
  useFnbShiftCountItemsTemplate,
} from "./hooks/useFnbShiftCount";
import { useFnbShiftCountHistory } from "./hooks/useFnbShiftCountHistory";
import {
  useFnbShiftCountLockShift,
  useFnbShiftCountSaveDayItems,
  useFnbShiftCountSaveShift,
  useFnbShiftCountUnlockShift,
} from "./hooks/useFnbShiftCountMutations";
import { useFnbShiftCountQueryConfig } from "./hooks/useFnbShiftCountQueryConfig";
import type { FnbShiftCountFormItem, ShiftCountField } from "./types";
import type { ShiftNo } from "@/apis/fnbShiftCount.apis";
import { formItemsFromResponse } from "./utils";

const FnbShiftCountPage = () => {
  const isAdmin = useIsAdmin();
  const { queryConfig, setQueryConfig } = useFnbShiftCountQueryConfig();
  const [formItems, setFormItems] = useState<FnbShiftCountFormItem[]>([]);
  const [savingCellKey, setSavingCellKey] = useState<string | null>(null);
  const [lockingShiftNo, setLockingShiftNo] = useState<ShiftNo | null>(null);

  const dateParams = useMemo(
    () => ({ date: queryConfig.date }),
    [queryConfig.date],
  );

  const {
    data: shiftCount,
    isLoading: isLoadingShiftCount,
    isFetching,
  } = useFnbShiftCount(dateParams);

  const { data: templateItems = [], isLoading: isLoadingTemplate } =
    useFnbShiftCountItemsTemplate();

  const historyParams = useMemo(
    () => ({
      ...(queryConfig.historyFrom ? { from: queryConfig.historyFrom } : {}),
      ...(queryConfig.historyTo ? { to: queryConfig.historyTo } : {}),
      page: queryConfig.historyPage,
      limit: queryConfig.historyLimit,
    }),
    [
      queryConfig.historyFrom,
      queryConfig.historyTo,
      queryConfig.historyPage,
      queryConfig.historyLimit,
    ],
  );

  const { data: historyData, isLoading: isLoadingHistory } =
    useFnbShiftCountHistory(
      historyParams,
      isAdmin && queryConfig.tab === "history",
    );

  const saveShiftMutation = useFnbShiftCountSaveShift();
  const saveDayItemsMutation = useFnbShiftCountSaveDayItems();
  const lockShiftMutation = useFnbShiftCountLockShift();
  const unlockShiftMutation = useFnbShiftCountUnlockShift();

  const isLoading = isLoadingShiftCount || isLoadingTemplate;
  const dayItemsEditable = shiftCount?.editable ?? false;

  useEffect(() => {
    if (!templateItems.length && !shiftCount?.items?.length) return;
    const merged = formItemsFromResponse(
      templateItems,
      shiftCount ?? { items: [] },
    );
    setFormItems(merged);
  }, [templateItems, shiftCount]);

  const handleShiftCellSave = (
    itemId: string,
    shiftNo: ShiftNo,
    field: ShiftCountField,
    value: number,
  ) => {
    if (!shiftCount?.shifts?.[shiftNo]?.editable) return;

    const cellKey = `${itemId}-s${shiftNo}-${field}`;
    setSavingCellKey(cellKey);

    saveShiftMutation.mutate(
      {
        shiftNo,
        date: queryConfig.date,
        body: {
          items: [{ itemId, [field]: value }],
        },
      },
      {
        onSettled: () => setSavingCellKey(null),
      },
    );
  };

  const handleDayFieldSave = (
    itemId: string,
    field: "totalStockIn" | "note",
    value: number | string,
  ) => {
    if (!dayItemsEditable) return;

    const cellKey = `${itemId}-day-${field}`;
    setSavingCellKey(cellKey);

    saveDayItemsMutation.mutate(
      {
        date: queryConfig.date,
        body: {
          items: [
            {
              itemId,
              ...(field === "totalStockIn"
                ? { totalStockIn: value as number }
                : { note: value as string }),
            },
          ],
        },
      },
      {
        onSettled: () => setSavingCellKey(null),
      },
    );
  };

  const handleLockShift = (shiftNo: ShiftNo) => {
    setLockingShiftNo(shiftNo);
    lockShiftMutation.mutate(
      { shiftNo, date: queryConfig.date },
      { onSettled: () => setLockingShiftNo(null) },
    );
  };

  const handleUnlockShift = (shiftNo: ShiftNo) => {
    setLockingShiftNo(shiftNo);
    unlockShiftMutation.mutate(
      { shiftNo, date: queryConfig.date },
      { onSettled: () => setLockingShiftNo(null) },
    );
  };

  const handleViewHistoryRecord = (
    record: NonNullable<typeof shiftCount>,
  ) => {
    setQueryConfig({
      tab: "entry",
      date: dayjs(record.businessDate).format("YYYY-MM-DD"),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kiểm kê FNB"
        description="Nhập mở ca / kết ca theo 3 ca trong ngày và đối chiếu với hệ thống bán hàng"
        icon={ClipboardList}
      />

      <Tabs
        value={queryConfig.tab}
        onValueChange={(value) => setQueryConfig({ tab: value })}
      >
        <TabsList>
          <TabsTrigger value="entry">Kiểm kê</TabsTrigger>
          {isAdmin && <TabsTrigger value="history">Lịch sử</TabsTrigger>}
        </TabsList>

        <TabsContent value="entry" className="mt-6 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Bộ lọc</CardTitle>
            </CardHeader>
            <CardContent>
              <ShiftCountFilters
                date={queryConfig.date}
                search={queryConfig.search}
                onDateChange={(date) => setQueryConfig({ date })}
                onSearchChange={(search) => setQueryConfig({ search })}
              />
            </CardContent>
          </Card>

          <ShiftCountSummary summary={shiftCount?.summary} />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Bảng kiểm kê</CardTitle>
              {isFetching && !isLoading && (
                <span className="text-xs text-muted-foreground">Đang tải...</span>
              )}
              {(saveShiftMutation.isPending ||
                saveDayItemsMutation.isPending ||
                lockShiftMutation.isPending ||
                unlockShiftMutation.isPending) && (
                <span className="text-xs font-medium text-primary">
                  Đang xử lý...
                </span>
              )}
            </CardHeader>
            <CardContent>
              <ShiftCountGrid
                items={formItems}
                shifts={shiftCount?.shifts}
                dayItemsEditable={dayItemsEditable}
                search={queryConfig.search}
                isLoading={isLoading}
                savingCellKey={savingCellKey}
                lockingShiftNo={lockingShiftNo}
                onShiftCellSave={handleShiftCellSave}
                onDayFieldSave={handleDayFieldSave}
                onLockShift={handleLockShift}
                onUnlockShift={handleUnlockShift}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lịch sử kiểm kê</CardTitle>
              </CardHeader>
              <CardContent>
                <ShiftCountHistoryTable
                  records={historyData?.items ?? []}
                  total={historyData?.total ?? 0}
                  page={historyData?.page ?? queryConfig.historyPage}
                  limit={historyData?.limit ?? queryConfig.historyLimit}
                  isLoading={isLoadingHistory}
                  historyFrom={queryConfig.historyFrom}
                  historyTo={queryConfig.historyTo}
                  onHistoryFromChange={(historyFrom) =>
                    setQueryConfig({ historyFrom, historyPage: 1 })
                  }
                  onHistoryToChange={(historyTo) =>
                    setQueryConfig({ historyTo, historyPage: 1 })
                  }
                  onPageChange={(historyPage) => setQueryConfig({ historyPage })}
                  onViewRecord={handleViewHistoryRecord}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default FnbShiftCountPage;
