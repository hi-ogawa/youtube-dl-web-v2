import { tinyassert } from "@hiogawa/utils";
import { range } from "lodash";
import { fetchDownload } from "../routes/api/download.api";
import {
  extractWebmInfo,
  findContainingRange,
  remuxWebm,
} from "./worker-client-libwebm";
import type { VideoInfo } from "./youtube-utils";

// chunk size is chosen so that
// - vercel's lambda timeouts in 10 seconds (on free plan)
// - maximum aws lambda's payload is 8MB
const CHUNK_SIZE = 2_000_000;

export interface DownloadProgress {
  result?: Uint8Array; // defined when finished processing
  offset: number;
  total: number;
  ratio: number;
}

export function downloadFastSeek(
  videoInfo: VideoInfo,
  format_id: string,
  startTime?: number,
  endTime?: number
): ReadableStream<DownloadProgress> {
  const format = videoInfo.formats.find((f) => f.format_id === format_id);
  tinyassert(format);

  const { filesize } = format;
  tinyassert(filesize);

  let cancelled = false;
  let metadataBuffer: Uint8Array;
  let frameBuffer: Uint8Array;
  let i = 0;
  let chunkRanges: [number, number][];
  let total = 0;
  let offset = 0;

  return new ReadableStream({
    async start() {
      // fetch only first 0.1% which is expected to include all "Cue" data
      const res = await fetchDownload({
        id: videoInfo.id,
        format_id,
        start: 0,
        end: Math.max(Math.ceil(filesize * 0.001), 2 * 10),
      });
      if (cancelled) return;

      tinyassert(res.ok);
      metadataBuffer = new Uint8Array(await res.arrayBuffer());
      if (cancelled) return;

      // parse webm for metadata
      const metadata = await extractWebmInfo(metadataBuffer);
      if (cancelled) return;

      // compute necessary chunk ranges
      const byteRange = findContainingRange(metadata, startTime, endTime);
      const start = byteRange.start;
      const end = byteRange.end ?? filesize;
      total = end - start;
      frameBuffer = new Uint8Array(total);
      chunkRanges = range(Math.ceil(total / CHUNK_SIZE)).map((i) => {
        return [
          start + CHUNK_SIZE * i,
          Math.min(start + CHUNK_SIZE * (i + 1), end),
        ];
      });
    },

    async pull(controller) {
      tinyassert(chunkRanges);

      //
      // finished downloading chunks
      //
      if (i >= chunkRanges.length) {
        // remux
        const result = await remuxWebm(metadataBuffer, frameBuffer);
        if (cancelled) return;

        // enqueue result and close
        controller.enqueue({
          result,
          offset,
          total,
          ratio: 1,
        });
        controller.close();
        return;
      }

      //
      // fetch next chunk (same logic as below `download` (non-fast-seek version))
      //
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
        frameBuffer.set(value, offset);
        offset += value.length;
        controller.enqueue({
          offset,
          total,
          ratio: offset / total,
        });
      }
    },
    cancel() {
      cancelled = true;
    },
  });
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
    async pull(controller) {
      //
      // finished downloading
      //
      if (i >= chunkRanges.length) {
        controller.enqueue({
          result,
          offset,
          total: filesize,
          ratio: 1,
        });
        controller.close();
        return;
      }

      //
      // fetch next chunk
      //
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
