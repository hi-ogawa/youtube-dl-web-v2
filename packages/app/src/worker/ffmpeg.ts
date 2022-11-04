import { METADATA_BLOCK_PICTURE, encode } from "@hiogawa/flac-picture";
import { expose } from "comlink";
import _ from "lodash";

export type { FFmpegWorker };

const IN_FILE = "/in.webm";
const OUT_FILE = "/out.opus";

class FFmpegWorker {
  async webmToOpus(
    webm: Uint8Array,
    metadata: Record<string, string>,
    jpeg?: Uint8Array
  ): Promise<Uint8Array> {
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

    // prettier-ignore
    const args = [
      "-hide_banner",
      "-i", IN_FILE,
      "-c", "copy",
      ...metadataArgs,
      OUT_FILE,
    ];
    const inFiles = [
      {
        path: IN_FILE,
        data: webm,
      },
    ];
    const outFiles = [
      {
        path: OUT_FILE,
      },
    ];

    args;
    inFiles;
    outFiles;
    return new Uint8Array();
  }
}

function main() {
  const worker = new FFmpegWorker();
  expose(worker);
}

main();
