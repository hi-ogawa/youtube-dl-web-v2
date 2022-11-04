import { run } from "@hiogawa/ffmpeg";
import { METADATA_BLOCK_PICTURE, encode } from "@hiogawa/flac-picture";
import { expose } from "comlink";
import _ from "lodash";
import { tinyassert } from "../utils/tinyassert";

export type { FFmpegWorker };

const IN_FILE = "/in.webm";
const OUT_FILE = "/out.opus";

class FFmpegWorker {
  async webmToOpus(
    // pass assets urls generated by vite
    moduleUrl: string,
    wasmUrl: string,
    workerUrl: string,
    // arguments
    webm: Uint8Array,
    metadata: Record<string, string>,
    jpeg?: Uint8Array
  ): Promise<Uint8Array> {
    // import emscripten module
    importScripts(moduleUrl);
    const initModule = (self as any).ffmpeg;
    tinyassert(initModule);

    // setup "-metadata" arguments
    const metadataArgs: string[] = [];
    for (const [k, v] of Object.entries(metadata)) {
      metadataArgs.push("-metadata", `${k}=${v}`);
    }
    if (jpeg) {
      const encodedJpeg = encode(jpeg);
      metadataArgs.push(
        "-metadata",
        `${METADATA_BLOCK_PICTURE}=${encodedJpeg}`
      );
    }

    // run ffmpeg cli
    const result = await run({
      initModule,
      moduleUrl,
      wasmUrl,
      workerUrl,
      // prettier-ignore
      arguments: [
        "-hide_banner",
        "-i", IN_FILE,
        "-c", "copy",
        ...metadataArgs,
        OUT_FILE,
      ],
      inFiles: [
        {
          path: IN_FILE,
          data: webm,
        },
      ],
      outFiles: [
        {
          path: OUT_FILE,
        },
      ],
    });

    tinyassert(result.exitCode === 0);
    const output = result.outFiles.find((f) => f.path === OUT_FILE);
    tinyassert(output);
    return output.data;
  }
}

function main() {
  const worker = new FFmpegWorker();
  expose(worker);
}

main();
