import { range } from "lodash";
import { fetchDownload } from "../routes/api/download.api";
import { tinyassert } from "./tinyassert";
import type { VideoInfo } from "./youtube-utils";

// chunk size is chosen so that
// - vercel's lambda timeouts in 10 seconds (on free plan)
// - maximum aws lambda's payload is 8MB
const CHUNK_SIZE = 2_000_000;

export interface DownloadProgress {
  result: Uint8Array;
  offset: number;
  total: number;
  ratio: number;
}

export function download(
  videoInfo: VideoInfo,
  format_id: string
): ReadableStream<DownloadProgress> {
  const format = videoInfo.formats.find((f) => f.format_id === format_id);
  tinyassert(format);

  const { filesize } = format;
  tinyassert(filesize);

  const numChunks = Math.ceil(filesize / CHUNK_SIZE);
  const chunkRanges = range(numChunks).map((i) => {
    return [CHUNK_SIZE * i, Math.min(CHUNK_SIZE * (i + 1), filesize)] as const;
  });

  let i = 0;
  let cancelled = false;
  let offset = 0;
  const result = new Uint8Array(filesize);

  return new ReadableStream({
    start(controller) {
      controller.enqueue;
      controller.close;
    },
    async pull(controller) {
      if (i >= chunkRanges.length) {
        controller.close();
        return;
      }
      const [start, end] = chunkRanges[i++];
      const res = await fetchDownload({
        id: videoInfo.id,
        format_id,
        start,
        end,
      });
      if (cancelled) {
        return;
      }
      tinyassert(res.body);

      const reader = res.body.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (cancelled) {
          return;
        }
        if (done) {
          break;
        }
        result.set(value, offset);
        offset += value.length;
        controller.enqueue({
          result,
          offset,
          total: filesize,
          ratio: offset / filesize,
        });
      }
    },
    cancel() {
      cancelled = true;
    },
  });
}
