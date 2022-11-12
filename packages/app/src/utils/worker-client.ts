import EMSCRIPTEN_MODULE_URL from "@hiogawa/ffmpeg/build/emscripten/Release/ex00-emscripten.js?url";
import EMSCRIPTEN_WASM_URL from "@hiogawa/ffmpeg/build/emscripten/Release/ex00-emscripten.wasm?url";
import { wrap } from "comlink";
import _ from "lodash";
import WORKER_URL from "../worker/build/ffmpeg.js?url";
import type { FFmpegWorker } from "../worker/ffmpeg";
import { tinyassert } from "./tinyassert";

// prefetch assets before instantiating emscripten worker
export const WORKER_ASSET_URLS = [
  WORKER_URL,
  EMSCRIPTEN_MODULE_URL,
  EMSCRIPTEN_WASM_URL,
];

const getWorkerV2 = _.memoize(async () => {
  const worker = new Worker(WORKER_URL);
  const workerImpl = wrap<FFmpegWorker>(worker);
  await workerImpl.initialize(EMSCRIPTEN_MODULE_URL, EMSCRIPTEN_WASM_URL);
  return workerImpl;
});

export async function webmToOpus(
  webm: Uint8Array,
  metadata: Record<string, string | undefined>,
  startTime?: string,
  endTime?: string,
  jpeg?: Uint8Array
): Promise<Uint8Array> {
  const workerImpl = await getWorkerV2();
  const output = await workerImpl.webmToOpus(
    webm,
    metadata,
    startTime,
    endTime,
    jpeg
  );
  return output;
}

export async function extractCoverArt(opus: Uint8Array): Promise<Uint8Array> {
  const workerImpl = await getWorkerV2();
  const output = await workerImpl.extractCoverArt(opus);
  return output;
}

export async function extractMetadata(
  opus: Uint8Array
): Promise<Record<string, string>> {
  const workerImpl = await getWorkerV2();
  const info = await workerImpl.extractMetadata(opus);
  const stream = info.streams.find((s) => s.type === "audio");
  tinyassert(stream);
  return stream.metadata;
}
