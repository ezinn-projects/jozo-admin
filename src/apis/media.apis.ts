const MEDIA_SERVICE_URL =
  import.meta.env.VITE_MEDIA_SERVICE_URL ?? "http://localhost:4001";

export type MediaStatus =
  | "pending"
  | "downloading"
  | "encoding"
  | "ready"
  | "failed";

export interface MediaJob {
  id: string;
  videoId?: string;
  status: MediaStatus;
  hlsUrl?: string;
  error?: string;
}

const parseMediaJob = (data: Record<string, unknown>): MediaJob => {
  const id = String(data.id ?? data.mediaId ?? data._id ?? "");
  const status = String(data.status ?? "pending") as MediaStatus;

  return {
    id,
    videoId: data.videoId != null ? String(data.videoId) : undefined,
    status,
    hlsUrl: data.hlsUrl != null ? String(data.hlsUrl) : undefined,
    error: data.error != null ? String(data.error) : undefined,
  };
};

const mediaFetch = async (
  path: string,
  init?: RequestInit,
): Promise<MediaJob> => {
  const response = await fetch(`${MEDIA_SERVICE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  const body = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    const message =
      (typeof body.message === "string" && body.message) ||
      (typeof body.error === "string" && body.error) ||
      `HTTP ${response.status}`;
    throw new Error(message);
  }

  return parseMediaJob(body);
};

export const createMediaJob = (videoId: string) =>
  mediaFetch("/api/media", {
    method: "POST",
    body: JSON.stringify({ videoId }),
  });

export const fetchMediaJob = (mediaId: string) =>
  mediaFetch(`/api/media/${mediaId}`);

export const isMediaJobActive = (status?: MediaStatus) =>
  status === "pending" ||
  status === "downloading" ||
  status === "encoding";

export const isMediaJobTerminal = (status?: MediaStatus) =>
  status === "ready" || status === "failed";
