import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMenuItems } from "@/hooks/use-menu-items";
import { useIsAdmin } from "@/hooks/usePermission";
import dayjs from "@/lib/dayjs";
import { ClipboardList, Loader2, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ShiftCountFilters from "./components/ShiftCountFilters";
import ShiftCountGrid from "./components/ShiftCountGrid";
import ShiftCountHistoryTable from "./components/ShiftCountHistoryTable";
import ShiftCountSummary from "./components/ShiftCountSummary";
import { useFnbShiftCount } from "./hooks/useFnbShiftCount";
import { useFnbShiftCountHistory } from "./hooks/useFnbShiftCountHistory";
import { useFnbShiftCountQueryConfig } from "./hooks/useFnbShiftCountQueryConfig";
import { useFnbShiftCountUpsert } from "./hooks/useFnbShiftCountUpsert";
import type { FnbShiftCountFormItem } from "./types";
import { mergeMenuWithShiftCount } from "./utils";

const FnbShiftCountPage = () => {
  const isAdmin = useIsAdmin();
  const { queryConfig, setQueryConfig } = useFnbShiftCountQueryConfig();
  const [formItems, setFormItems] = useState<FnbShiftCountFormItem[]>([]);
  const [note, setNote] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  const shiftCountParams = useMemo(
    () => ({
      date: queryConfig.date,
      ...(isAdmin && queryConfig.staffId ? { staffId: queryConfig.staffId } : {}),
    }),
    [queryConfig.date, queryConfig.staffId, isAdmin],
  );

  const {
    data: shiftCount,
    isLoading: isLoadingShiftCount,
    isFetching,
  } = useFnbShiftCount(shiftCountParams);

  const { menuItems, isLoading: isLoadingMenu } = useMenuItems();

  const mergedItems = useMemo(
    () => mergeMenuWithShiftCount(menuItems, shiftCount?.items),
    [menuItems, shiftCount?.items],
  );

  const historyParams = useMemo(
    () => ({
      ...(queryConfig.historyFrom ? { from: queryConfig.historyFrom } : {}),
      ...(queryConfig.historyTo ? { to: queryConfig.historyTo } : {}),
      ...(queryConfig.historyStaffId
        ? { staffId: queryConfig.historyStaffId }
        : {}),
    }),
    [
      queryConfig.historyFrom,
      queryConfig.historyTo,
      queryConfig.historyStaffId,
    ],
  );

  const { data: historyRecords = [], isLoading: isLoadingHistory } =
    useFnbShiftCountHistory(historyParams, isAdmin && queryConfig.tab === "history");

  const saveMutation = useFnbShiftCountUpsert();
  const isLoading =
    isLoadingShiftCount || (isLoadingMenu && !shiftCount?.items?.length);

  useEffect(() => {
    setIsDirty(false);
  }, [queryConfig.date, queryConfig.staffId]);

  useEffect(() => {
    if (isDirty) return;
    if (!shiftCount && menuItems.length === 0) return;
    setFormItems(mergedItems);
    setNote(shiftCount?.note ?? "");
  }, [mergedItems, shiftCount, isDirty, menuItems.length]);

  const handleSave = () => {
    if (shiftCount && !shiftCount.editable) return;

    saveMutation.mutate({
      date: queryConfig.date,
      ...(isAdmin && queryConfig.staffId ? { staffId: queryConfig.staffId } : {}),
      body: {
        note: note.trim() || undefined,
        items: formItems.map((item) => ({
          itemId: item.itemId,
          ...(item.openingCount !== "" ? { openingCount: item.openingCount } : {}),
          ...(item.closingCount !== "" ? { closingCount: item.closingCount } : {}),
        })),
      },
    }, {
      onSuccess: () => setIsDirty(false),
    });
  };

  const handleViewHistoryRecord = (record: NonNullable<typeof shiftCount>) => {
    setQueryConfig({
      tab: "entry",
      date: dayjs(record.businessDate).format("YYYY-MM-DD"),
      staffId: record.staffId,
    });
  };

  const editable = shiftCount?.editable ?? false;
  const isSaving = saveMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kiểm kê FNB"
        description="Nhập đầu ca / kết ca theo ngày và đối chiếu với hệ thống bán hàng"
        icon={ClipboardList}
        actions={
          queryConfig.tab === "entry" && editable ? (
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoading}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Lưu kiểm kê
            </Button>
          ) : null
        }
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
                staffId={queryConfig.staffId}
                search={queryConfig.search}
                isAdmin={isAdmin}
                onDateChange={(date) => setQueryConfig({ date })}
                onStaffIdChange={(staffId) => setQueryConfig({ staffId })}
                onSearchChange={(search) => setQueryConfig({ search })}
              />
            </CardContent>
          </Card>

          <ShiftCountSummary
            summary={shiftCount?.summary}
            staffName={shiftCount?.staffName}
            businessDate={
              shiftCount?.businessDate
                ? dayjs(shiftCount.businessDate).format("DD/MM/YYYY")
                : dayjs(queryConfig.date, "YYYY-MM-DD").format("DD/MM/YYYY")
            }
            editable={editable}
          />

          {!editable && shiftCount && (
            <p className="text-sm text-muted-foreground">
              Bản ghi này chỉ được xem. Chỉ có thể chỉnh sửa kiểm kê trong ngày hôm nay.
            </p>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Bảng kiểm kê</CardTitle>
              {isFetching && !isLoading && (
                <span className="text-xs text-muted-foreground">Đang tải...</span>
              )}
              {isDirty && (
                <span className="text-xs font-medium text-primary">
                  Có thay đổi chưa lưu
                </span>
              )}
            </CardHeader>
            <CardContent>
              <ShiftCountGrid
                items={formItems}
                note={note}
                editable={editable}
                search={queryConfig.search}
                isLoading={isLoading}
                onItemsChange={(items) => {
                  setFormItems(items);
                  setIsDirty(true);
                }}
                onNoteChange={(nextNote) => {
                  setNote(nextNote);
                  setIsDirty(true);
                }}
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
                  records={historyRecords}
                  isLoading={isLoadingHistory}
                  historyFrom={queryConfig.historyFrom}
                  historyTo={queryConfig.historyTo}
                  historyStaffId={queryConfig.historyStaffId}
                  onHistoryFromChange={(historyFrom) =>
                    setQueryConfig({ historyFrom })
                  }
                  onHistoryToChange={(historyTo) =>
                    setQueryConfig({ historyTo })
                  }
                  onHistoryStaffIdChange={(historyStaffId) =>
                    setQueryConfig({ historyStaffId })
                  }
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
