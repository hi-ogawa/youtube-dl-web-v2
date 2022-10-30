import fs from "node:fs";
import process from "node:process";
import init, { ModuleExports } from "@hiogawa/ffmpeg-experiment";
import { maxBy } from "lodash";
import undici from "undici";
import { tinyassert } from "../utils/tinyassert";
import {
  fetchVideoInfo,
  getThumbnailUrl,
  parseVideoId,
} from "../utils/youtube-utils";

// run as commonjs via esbuild-register and ts-esm-loader
tinyassert(typeof require !== "undefined");

const WASM_PATH = require.resolve(
  "@hiogawa/ffmpeg-experiment/build/index.wasm"
);

let Module: ModuleExports;

async function main() {
  // initialize wasm
  Module = await init({ locateFile: () => WASM_PATH });

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
  const encoded = Module.encodePictureMetadata(createVector(image));

  // convert to opus with metadata
  console.error(":: converting to opus...");
  const output = Module.convert(
    createVector(data),
    "opus",
    createStringMap({
      title,
      artist,
      METADATA_BLOCK_PICTURE: encoded,
    })
  );
  await fs.promises.writeFile(outFile, output.view());
}

function createVector(data: Uint8Array) {
  const vector = new Module.Vector();
  vector.resize(data.length, 0);
  vector.view().set(data);
  return vector;
}

function createStringMap(record: object) {
  const stringMap = new Module.StringMap();
  for (const [k, v] of Object.entries(record)) {
    if (typeof v === "string") {
      stringMap.set(k, v);
    }
  }
  return stringMap;
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

main();
