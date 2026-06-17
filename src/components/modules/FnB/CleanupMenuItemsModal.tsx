import { FnBMenuItemCleanupResult } from "@/apis/fnbMenu.apis";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";

interface CleanupMenuItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCleanup: (dryRun: boolean) => Promise<HTTPResponse<FnBMenuItemCleanupResult>>;
  isLoading: boolean;
  onSuccess?: () => void;
}

const CleanupSection = ({
  title,
  description,
  items,
  renderItem,
}: {
  title: string;
  description: string;
  items: { _id: string; name: string }[];
  renderItem?: (item: { _id: string; name: string }) => ReactNode;
}) => (
  <div className="rounded-md border p-3 space-y-2">
    <div className="flex items-center justify-between gap-2">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Badge variant={items.length > 0 ? "default" : "secondary"}>
        {items.length}
      </Badge>
    </div>
    {items.length > 0 ? (
      <ul className="max-h-32 overflow-y-auto space-y-1 text-sm">
        {items.map((item) => (
          <li
            key={item._id}
            className="text-muted-foreground border-l-2 border-muted pl-2"
          >
            {renderItem ? renderItem(item) : item.name}
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-xs text-muted-foreground">Không có mục nào</p>
    )}
  </div>
);

const CleanupMenuItemsModal = ({
  isOpen,
  onClose,
  onCleanup,
  isLoading,
  onSuccess,
}: CleanupMenuItemsModalProps) => {
  const [preview, setPreview] = useState<FnBMenuItemCleanupResult | null>(null);

  const loadPreview = async () => {
    const response = await onCleanup(true);
    setPreview(response.result ?? null);
  };

  useEffect(() => {
    if (isOpen) {
      loadPreview().catch(() => {
        setPreview(null);
      });
    } else {
      setPreview(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleApply = async () => {
    await onCleanup(false);
    onSuccess?.();
    onClose();
  };

  const totalChanges =
    (preview?.deletedOrphans.length ?? 0) +
    (preview?.normalizedParentIds.length ?? 0) +
    (preview?.removedExtraFields.length ?? 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Dọn dữ liệu menu</DialogTitle>
          <DialogDescription>
            Xóa variant mồ côi, chuẩn hóa parentId và loại bỏ field thừa. Bước
            đầu tiên luôn là xem trước, chưa ghi vào database.
          </DialogDescription>
        </DialogHeader>

        {isLoading && !preview ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Đang xem trước...
          </div>
        ) : preview ? (
          <div className="space-y-3">
            <CleanupSection
              title="Variant mồ côi"
              description="Parent không còn tồn tại — sẽ bị xóa"
              items={preview.deletedOrphans}
              renderItem={(item) => (
                <span>
                  {item.name}
                  {"parentId" in item && item.parentId ? (
                    <span className="block text-xs font-mono">
                      parentId: {String(item.parentId)}
                    </span>
                  ) : null}
                </span>
              )}
            />
            <CleanupSection
              title="Chuẩn hóa parentId"
              description='Đổi parentId: "" → null cho item gốc'
              items={preview.normalizedParentIds}
            />
            <CleanupSection
              title="Loại bỏ field thừa"
              description="Bỏ quantity, existingImage không hợp lệ"
              items={preview.removedExtraFields}
              renderItem={(item) => (
                <span>
                  {item.name}
                  {"fields" in item && Array.isArray(item.fields) ? (
                    <span className="block text-xs">
                      {item.fields.join(", ")}
                    </span>
                  ) : null}
                </span>
              )}
            />
            {totalChanges === 0 ? (
              <p className="text-sm text-green-600">
                Dữ liệu menu đã sạch, không cần dọn.
              </p>
            ) : (
              <p className="text-sm text-amber-600">
                Tổng cộng {totalChanges} thay đổi sẽ được áp dụng khi bạn xác
                nhận.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4">
            Không thể tải kết quả xem trước. Vui lòng thử lại.
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Đóng
          </Button>
          <Button
            variant="outline"
            onClick={loadPreview}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang tải...
              </>
            ) : (
              "Xem trước lại"
            )}
          </Button>
          <Button
            variant="destructive"
            onClick={handleApply}
            disabled={isLoading || totalChanges === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang áp dụng...
              </>
            ) : (
              "Áp dụng thay đổi"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CleanupMenuItemsModal;
