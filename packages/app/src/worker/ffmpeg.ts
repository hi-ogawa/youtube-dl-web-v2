import { run } from "@hiogawa/ffmpeg";
import { METADATA_BLOCK_PICTURE, encode } from "@hiogawa/flac-picture";
import { expose } from "comlink";
import _ from "lodash";
import { booleanGuard } from "../utils/boolean-guard";
import { tinyassert } from "../utils/tinyassert";

export type { FFmpegWorker };

class FFmpegWorker {
  async webmToOpus(
    // pass assets urls generated by vite
    moduleUrl: string,
    wasmUrl: string,
    workerUrl: string,
    // arguments
    webm: Uint8Array,
    metadata: Record<string, string>,
    startTime?: string,
    endTime?: string,
    jpeg?: Uint8Array
  ): Promise<Uint8Array> {
    // import emscripten module
    importScripts(moduleUrl);
    const initModule = (self as any).ffmpeg;
    tinyassert(initModule);

    // setup "-metadata" arguments
    const metadataArgs: string[] = [];
    for (const [k, v] of Object.entries(metadata)) {
      if (v) {
        metadataArgs.push("-metadata", `${k}=${v}`);
      }
    }
    if (jpeg) {
      const encodedJpeg = encode(jpeg);
      metadataArgs.push(
        "-metadata",
        `${METADATA_BLOCK_PICTURE}=${encodedJpeg}`
      );
    }

    //
    // run ffmpeg cli
    //

    const IN_FILE = "/in.webm";
    const OUT_FILE = "/out.opus";

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
        startTime && ["-ss", startTime],
        endTime && ["-to", endTime],
        OUT_FILE,
      ].flat().filter(booleanGuard),
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

  async extractCoverArt(
    // pass assets urls generated by vite
    moduleUrl: string,
    wasmUrl: string,
    workerUrl: string,
    // arguments
    opus: Uint8Array
  ): Promise<Uint8Array> {
    // import emscripten module
    importScripts(moduleUrl);
    const initModule = (self as any).ffmpeg;
    tinyassert(initModule);

    //
    // run ffmpeg cli
    //

    const IN_FILE = "/in.opus";
    const OUT_FILE = "/out.jpeg";

    const result = await run({
      initModule,
      moduleUrl,
      wasmUrl,
      workerUrl,
      // prettier-ignore
      arguments: [
        "-hide_banner",
        "-i", IN_FILE,
        "-c:v", "copy",
        "-f", "mjpeg",
        OUT_FILE,
      ],
      inFiles: [
        {
          path: IN_FILE,
          data: opus,
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
