import fs from "node:fs";
import process from "node:process";
import { run } from "@hiogawa/ffmpeg";
import { encode } from "@hiogawa/flac-picture";
import { maxBy } from "lodash";
import undici from "undici";
import { tinyassert } from "../utils/tinyassert";
import {
  fetchVideoInfo,
  getThumbnailUrl,
  parseVideoId,
} from "../utils/youtube-utils";

async function main() {
  // patch global
  (globalThis as any).fetch ??= undici.fetch;

  // cli
  const cli = new Cli(process.argv.slice(2));
  const idArg = cli.arg("--id");
  const title = cli.arg("--title");
  const artist = cli.arg("--artist");
  const outFile = cli.arg("--out");
  tinyassert(idArg);
  tinyassert(outFile);

  // fetch video info
  console.error(":: downloading video info...");
  const id = parseVideoId(idArg);
  tinyassert(id);
  const videoInfo = await fetchVideoInfo(id);

  // choose format
  const format = maxBy(
    videoInfo.formats.filter(
      (f) => f.acodec !== "none" && f.ext === "webm" && f.filesize
    ),
    (f) => f.filesize
  );
  tinyassert(format);

  // fetch format (download is throttled without range header)
  console.error(":: downloading media...");
  const resFormat = await fetch(format.url, { headers: { range: "bytes=0-" } });
  tinyassert(resFormat.ok);
  const data = new Uint8Array(await resFormat.arrayBuffer());

  // fetch cover art
  console.error(":: downloading thumbnail...");
  const resImage = await fetch(getThumbnailUrl(id));
  tinyassert(resImage.ok);
  const image = new Uint8Array(await resImage.arrayBuffer());

  // encode cover art
  const encoded = encode(image);

  // convert to opus with metadata
  console.error(":: converting to opus...");
  const output = await webmToOpus(data, {
    title,
    artist,
    METADATA_BLOCK_PICTURE: encoded,
  });

  // write output
  await fs.promises.writeFile(outFile, output);
}

async function webmToOpus(
  webm: Uint8Array,
  metadata: Partial<Record<string, string>>
): Promise<Uint8Array> {
  // setup "-metadata" arguments
  const metadataArgs: string[] = [];
  for (const [k, v] of Object.entries(metadata)) {
    if (typeof v === "string") {
      metadataArgs.push("-metadata", `${k}=${v}`);
    }
  }

  const IN_FILE = "/in.webm";
  const OUT_FILE = "/out.opus";

  // run ffmpeg main
  const result = await run({
    initModule: require("@hiogawa/ffmpeg/build/ffmpeg/wasm-release/ffmpeg_g.js"),
    moduleUrl: require.resolve(
      "@hiogawa/ffmpeg/build/ffmpeg/wasm-release/ffmpeg_g.js"
    ),
    wasmUrl: require.resolve(
      "@hiogawa/ffmpeg/build/ffmpeg/wasm-release/ffmpeg_g.wasm"
    ),
    workerUrl: require.resolve(
      "@hiogawa/ffmpeg/build/ffmpeg/wasm-release/ffmpeg_g.worker.js"
    ),
    arguments: [
      "-hide_banner",
      "-i",
      IN_FILE,
      "-c",
      "copy",
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

//
// cli
//

class Cli {
  constructor(private argv: string[]) {}

  arg(flag: string): string | undefined {
    const index = this.argv.indexOf(flag);
    return index !== -1 ? this.argv[index + 1] : undefined;
  }
}

// main
main();
