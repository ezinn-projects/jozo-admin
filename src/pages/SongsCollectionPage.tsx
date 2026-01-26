import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDeleteSong, useNormalizeSongs, useSongsCollection } from "@/hooks/use-room-music";
import { formatDate } from "@/utils/formatters";
import { Loader2, Music, RefreshCcw, Search, Trash2, Wand2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import PaginationContainer from "@/pages/RecruitmentPage/components/PaginationContainer";

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

  // Extract songs and pagination from response
  const songs = responseData?.result?.songs || [];
  const pagination = responseData?.result?.pagination;
  
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
                      <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 text-xs">
                        No image
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
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SongsCollectionPage;
