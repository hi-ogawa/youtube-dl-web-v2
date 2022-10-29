import init from "@hiogawa/ffmpeg-experiment";
import type { ModuleExports } from "@hiogawa/ffmpeg-experiment";
import WASM_URL from "@hiogawa/ffmpeg-experiment/build/index.wasm?url";
import { expose } from "comlink";

// for comlink typing
export type { WorkerImpl };

let Module: ModuleExports;

class WorkerImpl {
  async initialize() {
    Module = await init({ locateFile: () => WASM_URL });
  }

  convert(arg: {
    data: Uint8Array;
    outFormat: string;
    metadata: Record<string, string>;
    picture?: Uint8Array;
  }): Uint8Array {
    const stringMap = new Module.StringMap();
    if (arg.metadata) {
      for (const [k, v] of Object.entries(arg.metadata)) {
        stringMap.set(k, v);
      }
    }
    if (arg.picture) {
      const encoded = Module.encodePictureMetadata(createVector(arg.picture));
      stringMap.set("METADATA_BLOCK_PICTURE", encoded);
    }

    const output = Module.convert(
      createVector(arg.data),
      arg.outFormat,
      stringMap
    );
    return output.view();
  }
}

function createVector(data: Uint8Array) {
  const vector = new Module.Vector();
  vector.resize(data.length, 0);
  vector.view().set(data);
  return vector;
}

function main() {
  const worker = new WorkerImpl();
  expose(worker);
}

main();
