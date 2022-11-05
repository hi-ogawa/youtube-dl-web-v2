import FFMPEG_MODULE_URL from "@hiogawa/ffmpeg/build/ffmpeg/wasm-release/ffmpeg_g.js?url";
import FFMPEG_WASM_URL from "@hiogawa/ffmpeg/build/ffmpeg/wasm-release/ffmpeg_g.wasm?url";
import FFMPEG_WORKER_URL from "@hiogawa/ffmpeg/build/ffmpeg/wasm-release/ffmpeg_g.worker.js?url";
import { wrap } from "comlink";
import _ from "lodash";

import WORKER_URL from "../worker/build/ffmpeg.js?url";
import type { FFmpegWorker } from "../worker/ffmpeg";

// prefetch assets before instantiating emscripten worker
export const WORKER_ASSET_URLS = [
  WORKER_URL,
  FFMPEG_MODULE_URL,
  FFMPEG_WORKER_URL,
  FFMPEG_WASM_URL,
];

export async function webmToOpus(
  webm: Uint8Array,
  metadata: Record<string, string>,
  jpeg?: Uint8Array
): Promise<Uint8Array> {
  const worker = new Worker(WORKER_URL);
  try {
    const workerImpl = wrap<FFmpegWorker>(worker);
    const output = await workerImpl.webmToOpus(
      FFMPEG_MODULE_URL,
      FFMPEG_WASM_URL,
      FFMPEG_WORKER_URL,
      webm,
      metadata,
      jpeg
    );
    return output;
  } finally {
    worker.terminate();
  }
}
