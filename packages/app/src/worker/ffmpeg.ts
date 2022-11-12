import type {
  EmbindVector,
  EmscriptenInit,
  EmscriptenModule,
  Metadata,
} from "@hiogawa/ffmpeg/build/tsc/cpp/ex00-emscripten-types";
import { METADATA_BLOCK_PICTURE, encode } from "@hiogawa/flac-picture";
import { expose } from "comlink";
import _ from "lodash";
import { tinyassert } from "../utils/tinyassert";

export type { FFmpegWorker };

let Module: EmscriptenModule;

class FFmpegWorker {
  async initialize(moduleUrl: string, wasmUrl: string): Promise<void> {
    importScripts(moduleUrl);
    const init: EmscriptenInit = (self as any)["Module"];
    tinyassert(init);
    Module = await init({ locateFile: () => wasmUrl });
  }

  async webmToOpus(
    webm: Uint8Array,
    metadata: Record<string, string | undefined>,
    startTime?: string,
    endTime?: string,
    jpeg?: Uint8Array
  ): Promise<Uint8Array> {
    tinyassert(Module);

    // metadata
    const metadataMap = new Module.embind_StringMap();
    for (const [k, v] of Object.entries(metadata)) {
      if (v) {
        metadataMap.set(k, v);
      }
    }
    if (jpeg) {
      const encodedJpeg = encode(jpeg);
      metadataMap.set(METADATA_BLOCK_PICTURE, encodedJpeg);
    }

    // process
    const outData = Module.embind_convert(
      arrayToVector(webm),
      "opus",
      metadataMap,
      startTime ? parseTimestamp(startTime) : -1,
      endTime ? parseTimestamp(endTime) : -1
    );
    return outData.view();
  }

  async extractCoverArt(opus: Uint8Array): Promise<Uint8Array> {
    // process
    const outData = Module.embind_convert(
      arrayToVector(opus),
      "mjpeg",
      new Module.embind_StringMap(),
      -1,
      -1
    );
    return outData.view();
  }

  async extractMetadata(opus: Uint8Array): Promise<Metadata> {
    const outData = Module.embind_extractMetadata(arrayToVector(opus));
    return JSON.parse(outData);
  }
}

//
// utils
//

// hh:mm:ss.xxx => seconds
function parseTimestamp(time: string): number {
  const [hh, mm, ssxxx] = time.split(":");
  tinyassert(hh && mm && ssxxx);
  const [ss, xxx] = ssxxx.split(".");
  return (
    (Number(hh) * 60 + Number(mm)) * 60 + Number(ss) + Number(xxx ?? 0) / 1000
  );
}

function arrayToVector(data: Uint8Array): EmbindVector {
  const vector = new Module.embind_Vector();
  vector.resize(data.length, 0);
  vector.view().set(data);
  return vector;
}

//
// main
//

function main() {
  const worker = new FFmpegWorker();
  expose(worker);
}

main();
