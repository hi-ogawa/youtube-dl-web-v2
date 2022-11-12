import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { METADATA_BLOCK_PICTURE, encode } from "@hiogawa/flac-picture";
import { tinyassert } from "../tinyassert";

const DEFAULT_MODULE_PATH = "build/emscripten/Release/ex00-emscripten.js";

async function mainConvert(cli: Cli) {
  const modulePath = cli.getArgument("--module") ?? DEFAULT_MODULE_PATH;
  const inFile = cli.getArgument("--in");
  const outFile = cli.getArgument("--out");
  const title = cli.getArgument("--title");
  const artist = cli.getArgument("--artist");
  const thumbnail = cli.getArgument("--thumbnail");
  const startTime = Number(cli.getArgument("--start-time") ?? -1);
  const endTime = Number(cli.getArgument("--end-time") ?? -1);
  tinyassert(inFile);
  tinyassert(outFile);

  // initialize emscritpen module
  const init: EmscriptenInit = require(path.resolve(modulePath));
  const Module: EmscriptenModule = await init();

  // media data
  const inData = new Module.embind_Vector();
  await readFileToVector(inData, inFile);

  // metadata
  const metadata = new Module.embind_StringMap();
  for (const [k, v] of Object.entries({ title, artist })) {
    if (v) {
      metadata.set(k, v);
    }
  }
  if (thumbnail) {
    const thumbnailData = await fs.promises.readFile(thumbnail);
    const encoded = encode(thumbnailData);
    metadata.set(METADATA_BLOCK_PICTURE, encoded);
  }

  const outData = Module.embind_convert(
    inData,
    "opus",
    metadata,
    startTime,
    endTime
  );
  await fs.promises.writeFile(outFile, outData.view());
}

async function mainExtractMetadata(cli: Cli) {
  const modulePath = cli.getArgument("--module") ?? DEFAULT_MODULE_PATH;
  const inFile = cli.getArgument("--in");
  tinyassert(inFile);

  // initialize emscritpen module
  const init: EmscriptenInit = require(path.resolve(modulePath));
  const Module: EmscriptenModule = await init();

  // read data
  const inData = new Module.embind_Vector();
  await readFileToVector(inData, inFile);

  // process
  const outData = Module.embind_extractMetadata(inData);
  console.log(outData);
}

async function main() {
  const cli = new Cli(process.argv.slice(2));
  if (process.argv[2] === "convert") {
    return mainConvert(cli);
  }
  if (process.argv[2] === "extract-metadata") {
    return mainExtractMetadata(cli);
  }
  process.exit(-1);
}

//
// utils
//

interface EmbindVector {
  resize: (length: number, defaultValue: number) => void;
  view(): Uint8Array;
}

interface EmbindStringMap {
  set(k: string, v: string): void;
}

interface EmscriptenModule {
  embind_Vector: new () => EmbindVector;
  embind_StringMap: new () => EmbindStringMap;
  embind_convert: (
    in_data: EmbindVector,
    out_format: string,
    metadata: EmbindStringMap,
    start_time: number,
    end_time: number
  ) => EmbindVector;
  embind_extractMetadata: (in_data: EmbindVector) => string;
}

type EmscriptenInit = (options?: {}) => Promise<EmscriptenModule>;

async function readFileToVector(
  vector: EmbindVector,
  filename: string
): Promise<void> {
  const buffer = await fs.promises.readFile(filename);
  vector.resize(buffer.length, 0);
  vector.view().set(new Uint8Array(buffer));
}

class Cli {
  constructor(private argv: string[]) {}

  getArgument(flag: string): string | undefined {
    const index = this.argv.indexOf(flag);
    if (index !== -1) {
      return this.argv[index + 1];
    }
    return;
  }
}

if (require.main === module) {
  main();
}
