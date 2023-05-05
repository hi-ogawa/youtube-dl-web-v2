import EMSCRIPTEN_MODULE_URL from "@hiogawa/ffmpeg/build/emscripten/Release/ex01-emscripten.js?url";
import EMSCRIPTEN_WASM_URL from "@hiogawa/ffmpeg/build/emscripten/Release/ex01-emscripten.wasm?url";
import type { SimpleMetadata } from "@hiogawa/ffmpeg/build/tsc/cpp/ex01-emscripten-types";
import { tinyassert } from "@hiogawa/utils";
import { transfer, wrap } from "comlink";
import _ from "lodash";
import WORKER_URL from "../worker/build/libwebm.js?url";
import type { LibwebmWorker } from "../worker/libwebm";

// prefetch assets before instantiating emscripten worker
export const WORKER_ASSET_URLS_LIBWEBM = [
  EMSCRIPTEN_MODULE_URL,
  EMSCRIPTEN_WASM_URL,
];

const getWorker = _.memoize(async () => {
  const worker = new Worker(WORKER_URL);
  const workerImpl = wrap<LibwebmWorker>(worker);
  await workerImpl.initialize(EMSCRIPTEN_MODULE_URL, EMSCRIPTEN_WASM_URL);
  return workerImpl;
});

export async function extractWebmInfo(
  webmMetadataBuffer: Uint8Array
): Promise<SimpleMetadata> {
  const workerImpl = await getWorker();
  const output = await workerImpl.extractWebmInfo(webmMetadataBuffer);
  return output;
}

export async function remuxWebm(
  webmMetadataBuffer: Uint8Array,
  webmFrameBuffer: Uint8Array
): Promise<Uint8Array> {
  const workerImpl = await getWorker();
  const output = await workerImpl.remux(
    webmMetadataBuffer,
    transfer(webmFrameBuffer, [webmFrameBuffer.buffer])
  );
  return output;
}

// copied from packages/ffmpeg/src/cpp/ex01-emscripten-cli.ts

interface ContainingRange {
  // byte offset of containing clusters
  start: number;
  end?: number;
}

export function findContainingRange(
  metadata: SimpleMetadata,
  startTime?: number,
  endTime?: number
): ContainingRange {
  tinyassert(metadata.segment_body_start);
  tinyassert(metadata.track_entries.length === 1);

  interface StrictCuePont {
    time: number;
    cluster_position: number;
  }
  const cuePoints: StrictCuePont[] = metadata.cue_points.map((c) => {
    const { time, cluster_position } = c;
    tinyassert(typeof time === "number");
    tinyassert(typeof cluster_position === "number");
    return { time: time / 1000, cluster_position };
  });

  const startCue = startTime
    ? [...cuePoints].reverse().find((c) => c.time <= startTime)
    : cuePoints[0];
  const endCue = endTime && cuePoints.find((c) => c.time > endTime);
  tinyassert(startCue);

  return {
    start: startCue.cluster_position + metadata.segment_body_start,
    end: endCue
      ? endCue.cluster_position + metadata.segment_body_start
      : undefined,
  };
}
