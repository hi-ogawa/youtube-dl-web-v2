import type {
  EmbindVector,
  EmscriptenInit,
  EmscriptenModule,
  SimpleMetadata,
} from "@hiogawa/ffmpeg/build/tsc/cpp/ex01-emscripten-types";
import { tinyassert } from "@hiogawa/utils";
import { expose } from "comlink";
import _ from "lodash";

export type { LibwebmWorker };

let Module: EmscriptenModule;

class LibwebmWorker {
  async initialize(moduleUrl: string, wasmUrl: string): Promise<void> {
    importScripts(moduleUrl);
    const init: EmscriptenInit = (self as any)["Module"];
    tinyassert(init);
    Module = await init({ locateFile: () => wasmUrl });
  }

  extractWebmInfo(
    webmMetadataBuffer: Uint8Array // partial webm data
  ): SimpleMetadata {
    tinyassert(Module);

    const metadataString = Module.embind_parseMetadataWrapper(
      arrayToVector(webmMetadataBuffer)
    );
    const metadata: SimpleMetadata = JSON.parse(metadataString);
    return metadata;
  }

  remux(
    webmMetadataBuffer: Uint8Array,
    webmFrameBuffer: Uint8Array
  ): Uint8Array {
    const outData = Module.embind_remuxWrapper(
      arrayToVector(webmMetadataBuffer),
      arrayToVector(webmFrameBuffer),
      false /* fix_timestamp */
    );
    return outData.view();
  }
}

//
// utils
//

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
  const worker = new LibwebmWorker();
  expose(worker);
}

main();
