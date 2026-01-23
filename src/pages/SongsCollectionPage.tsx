import { PageHeader } from "@/components/shared";
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
import { useSongsCollection } from "@/hooks/use-room-music";
import { formatDate } from "@/utils/formatters";
import { Music, RefreshCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";

const SongsCollectionPage = () => {
  const {
    data: songs = [],
    isLoading,
    isFetching,
    refetch,
    error,
  } = useSongsCollection();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSongs = useMemo(
    () =>
      songs.filter((song) => {
        const term = searchTerm.toLowerCase();
        return (
          song.title.toLowerCase().includes(term) ||
          song.author.toLowerCase().includes(term) ||
          song.video_id.toLowerCase().includes(term)
        );
      }),
    [songs, searchTerm]
  );

  const formatDuration = (seconds?: number) => {
    if (seconds === undefined || Number.isNaN(seconds)) return "-";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
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
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-md hover:bg-gray-50"
            disabled={isFetching}
          >
            <RefreshCcw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSongs.map((song) => (
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
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredSongs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm
                ? "Không tìm thấy bài hát phù hợp"
                : "Chưa có bài hát nào trong collection"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SongsCollectionPage;
