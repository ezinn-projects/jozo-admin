import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PruneUnavailableYoutubeResult } from "@/apis/roomMusic.apis";
import {
  useDeleteSong,
  useNormalizeSongs,
  usePruneUnavailableYoutube,
  useSongsCollection,
} from "@/hooks/use-room-music";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/utils/formatters";
import {
  Loader2,
  Music,
  RefreshCcw,
  Search,
  Trash2,
  Wand2,
  Youtube,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import PaginationContainer from "@/pages/RecruitmentPage/components/PaginationContainer";

/** Chỉ render bảng video_id khi BE trả mảng và độ dài ≤ ngưỡng này */
const MAX_VIDEO_IDS_TO_RENDER = 200;

const SongsCollectionPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const shouldKeepFocusRef = useRef(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        shouldKeepFocusRef.current = true;
      }
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset về trang đầu tiên khi search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data: responseData,
    isLoading,
    isFetching,
    refetch,
    error,
  } = useSongsCollection({
    page: currentPage,
    limit: pageSize,
    keyword: debouncedSearchTerm || undefined,
  });

  // Keep focus on input after search completes
  useEffect(() => {
    if (shouldKeepFocusRef.current && !isFetching && searchInputRef.current) {
      // Use setTimeout to ensure focus happens after render
      setTimeout(() => {
        searchInputRef.current?.focus();
        shouldKeepFocusRef.current = false;
      }, 0);
    }
  }, [isFetching]);

  const {
    mutate: normalizeSongs,
    isPending: isNormalizing,
  } = useNormalizeSongs();

  const {
    mutate: deleteSong,
    isPending: isDeleting,
  } = useDeleteSong();

  const { mutateAsync: pruneUnavailableYoutube, isPending: isPruningYoutube } =
    usePruneUnavailableYoutube();
  const { toast } = useToast();

  const [youtubePruneOpen, setYoutubePruneOpen] = useState(false);
  const [youtubePruneLoading, setYoutubePruneLoading] = useState(false);
  const [youtubePrunePayload, setYoutubePrunePayload] = useState<{
    message: string;
    result: PruneUnavailableYoutubeResult;
  } | null>(null);

  // Extract songs and pagination from response
  const songs = responseData?.result?.songs || [];
  const pagination = responseData?.result?.pagination;

  const titleByVideoId = useMemo(
    () => new Map(songs.map((s) => [s.video_id, s.title] as const)),
    [songs],
  );

  const handleYoutubePruneLibrary = async () => {
    const ok = window.confirm(
      "Chạy dọn toàn bộ bài YouTube không khả dụng trong thư viện? Một lần gọi API duy nhất — có thể rất lâu (nhiều phút). Giữ tab mở; nếu hay bị timeout hãy chạy từ BE/cron hoặc tăng timeout proxy.",
    );
    if (!ok) return;
    setYoutubePrunePayload(null);
    setYoutubePruneOpen(true);
    setYoutubePruneLoading(true);
    try {
      const { data } = await pruneUnavailableYoutube({
        omitIds: true,
      });
      const result = data?.result;
      if (!result) {
        toast({
          title: "Thiếu dữ liệu",
          description: "API không trả result.",
          variant: "destructive",
        });
        setYoutubePruneOpen(false);
        return;
      }
      setYoutubePrunePayload({
        message: data?.message ?? "",
        result,
      });
    } catch {
      setYoutubePruneOpen(false);
    } finally {
      setYoutubePruneLoading(false);
    }
  };
  
  // Use pagination info from API
  const total = pagination?.total || 0;
  const totalPages = pagination?.totalPages || 0;

  const formatDuration = (seconds?: number) => {
    if (seconds === undefined || Number.isNaN(seconds)) return "-";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset về trang đầu tiên khi thay đổi page size
  };

  const handleDeleteSong = (videoId: string, title: string) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa bài hát "${title}" khỏi collection?`
    );
    if (confirmed) {
      deleteSong(videoId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Đang tải danh sách bài hát...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="text-lg text-red-600">
          Không thể tải danh sách bài hát
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <RefreshCcw className="w-4 h-4" />
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bộ sưu tập bài hát"
        description="Xem danh sách các bài hát đã được lưu vào collection"
        icon={Music}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const ok = window.confirm(
                  "Chuẩn hóa sẽ cập nhật title_normalized/author_normalized cho dữ liệu cũ. Tiếp tục?"
                );
                if (ok) normalizeSongs();
              }}
              disabled={isNormalizing}
            >
              {isNormalizing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              Chuẩn hóa dữ liệu
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={handleYoutubePruneLibrary}
              disabled={isPruningYoutube}
            >
              {isPruningYoutube ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Youtube className="w-4 h-4 mr-2" />
              )}
              Dọn thư viện YouTube
            </Button>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCcw
                className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
              />
              Làm mới
            </Button>
          </div>
        }
      />

      <Dialog
        open={youtubePruneOpen}
        onOpenChange={(open) => {
          if (!open && youtubePruneLoading) return;
          setYoutubePruneOpen(open);
          if (!open) {
            setYoutubePrunePayload(null);
            setYoutubePruneLoading(false);
          }
        }}
      >
        <DialogContent
          className="max-w-lg max-h-[85vh] flex flex-col gap-0 p-0"
          onPointerDownOutside={(e) => youtubePruneLoading && e.preventDefault()}
          onEscapeKeyDown={(e) => youtubePruneLoading && e.preventDefault()}
        >
          <DialogHeader className="p-6 pb-2 space-y-1 shrink-0">
            <DialogTitle>Dọn thư viện YouTube</DialogTitle>
            <DialogDescription>
              Một lần gọi{" "}
              <span className="font-mono text-xs">
                POST /room-music/songs/prune-unavailable-youtube?omit_ids=1
              </span>
              . Phản hồi chỉ gồm số liệu (không tải mảng video_id).
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-4 space-y-4 overflow-y-auto flex-1 min-h-0 text-sm">
            {youtubePruneLoading ? (
              <div className="flex flex-col items-center gap-4 py-10 text-center text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin text-foreground" />
                <p>
                  Đang chạy trên server — có thể rất lâu với thư viện lớn. Không đóng tab;
                  nếu trình duyệt hay timeout, hãy chạy job từ BE nội bộ hoặc cron.
                </p>
              </div>
            ) : youtubePrunePayload ? (
              <>
                {youtubePrunePayload.message ? (
                  <div className="space-y-1 rounded-md border bg-muted/40 p-3">
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      message
                    </p>
                    <p className="whitespace-pre-wrap">{youtubePrunePayload.message}</p>
                  </div>
                ) : null}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-md border bg-muted/40 p-3">
                  <span className="text-muted-foreground">checked</span>
                  <span className="font-medium tabular-nums">
                    {youtubePrunePayload.result.checked}
                  </span>
                  <span className="text-muted-foreground">skipped_unknown</span>
                  <span className="font-medium tabular-nums">
                    {youtubePrunePayload.result.skipped_unknown}
                  </span>
                  <span className="text-muted-foreground">unavailable_on_youtube</span>
                  <span className="font-medium tabular-nums">
                    {youtubePrunePayload.result.unavailable_on_youtube}
                  </span>
                  <span className="text-muted-foreground">removed_from_db</span>
                  <span className="font-medium tabular-nums">
                    {youtubePrunePayload.result.removed_from_db}
                  </span>
                  <span className="text-muted-foreground">dry_run</span>
                  <span className="font-medium">
                    {youtubePrunePayload.result.dry_run ? "true" : "false"}
                  </span>
                </div>
                {(() => {
                  const ids =
                    youtubePrunePayload.result.video_ids_removed_or_would_remove ??
                    [];
                  if (ids.length === 0) {
                    return (
                      <p className="text-muted-foreground">
                        Không có danh sách video_id trong phản hồi (omit_ids=1 hoặc không có
                        bản ghi tương ứng).
                      </p>
                    );
                  }
                  if (ids.length > MAX_VIDEO_IDS_TO_RENDER) {
                    return (
                      <p className="text-muted-foreground">
                        Danh sách quá dài ({ids.length} mục) — không hiển thị bảng trên FE.
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        video_ids_removed_or_would_remove
                      </p>
                      <div className="max-h-[min(40vh,240px)] overflow-auto rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[140px]">video_id</TableHead>
                              <TableHead>Tiêu đề (trang hiện tại)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ids.map((vid) => (
                              <TableRow key={vid}>
                                <TableCell className="font-mono text-xs">{vid}</TableCell>
                                <TableCell>{titleByVideoId.get(vid) ?? "—"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : null}
          </div>
          <DialogFooter className="p-6 pt-2 border-t bg-background shrink-0 flex-row flex-wrap gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setYoutubePruneOpen(false)}
              disabled={youtubePruneLoading}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              ref={searchInputRef}
              placeholder="Tìm kiếm theo tên bài hát, tác giả hoặc video ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách bài hát đã lưu</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thumbnail</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Tác giả</TableHead>
                <TableHead>Video ID</TableHead>
                <TableHead>Thời lượng</TableHead>
                <TableHead>Ngày thêm</TableHead>
                <TableHead>Cập nhật</TableHead>
                <TableHead className="w-[100px]">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {songs.map((song) => (
                <TableRow key={song._id || song.video_id}>
                  <TableCell>
                    {song.thumbnail ? (
                      <img
                        src={song.thumbnail}
                        alt={song.title}
                        className="w-16 h-16 rounded-md object-cover"
                      />
                    ) : (
                      <div
                        className="w-16 h-16 rounded-md flex items-center justify-center text-[10px] font-semibold leading-tight text-center px-0.5 bg-red-500 text-white border border-red-600 shadow-sm"
                        title="Bản ghi không có thumbnail"
                      >
                        Thiếu ảnh
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[280px]">
                    <div className="font-medium line-clamp-2">{song.title}</div>
                    {song.url && (
                      <a
                        href={song.url}
                        className="text-xs text-blue-600 hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Mở liên kết
                      </a>
                    )}
                  </TableCell>
                  <TableCell>{song.author}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {song.video_id}
                  </TableCell>
                  <TableCell>{formatDuration(song.duration)}</TableCell>
                  <TableCell>
                    {song.created_at
                      ? formatDate(String(song.created_at))
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {song.updated_at
                      ? formatDate(String(song.updated_at))
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSong(song.video_id, song.title)}
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {songs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {debouncedSearchTerm
                ? "Không tìm thấy bài hát phù hợp"
                : "Chưa có bài hát nào trong collection"}
            </div>
          )}

          {songs.length > 0 && (
            <PaginationContainer
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              total={total}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={[10, 20, 50, 100, 1000]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SongsCollectionPage;
