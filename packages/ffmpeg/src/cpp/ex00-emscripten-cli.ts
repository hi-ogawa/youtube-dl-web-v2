import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { METADATA_BLOCK_PICTURE, encode } from "@hiogawa/flac-picture";
import { z } from "zod";
import { tinycli, tinycliMulti } from "../tinycli";
import type {
  EmbindVector,
  EmscriptenInit,
  EmscriptenModule,
} from "./ex00-emscripten-types";

const DEFAULT_MODULE_PATH = "build/emscripten/Release/ex00-emscripten.js";

//
// convert
//

const convert = tinycli(
  z.object({
    module: z.string().default(DEFAULT_MODULE_PATH),
    in: z.string(),
    out: z.string(),
    outFormat: z.string(),
    thumbnail: z.string().optional(),
    title: z.string().optional(),
    artist: z.string().optional(),
    startTime: z.preprocess(Number, z.number()).default(-1),
    endTime: z.preprocess(Number, z.number()).default(-1),
  }),
  async (args) => {
    // initialize emscritpen module
    const init: EmscriptenInit = require(path.resolve(args.module));
    const Module: EmscriptenModule = await init();

    // media data
    const inData = new Module.embind_Vector();
    await readFileToVector(inData, args.in);

    // metadata
    const metadata = new Module.embind_StringMap();
    for (const [k, v] of Object.entries({
      title: args.title,
      artist: args.artist,
    })) {
      if (v) {
        metadata.set(k, v);
      }
    }
    if (args.thumbnail) {
      const thumbnailData = await fs.promises.readFile(args.thumbnail);
      const encoded = encode(thumbnailData);
      metadata.set(METADATA_BLOCK_PICTURE, encoded);
    }

    const outData = Module.embind_convert(
      inData,
      args.outFormat,
      metadata,
      args.startTime,
      args.endTime
    );
    await fs.promises.writeFile(args.out, outData.view());
  }
);

//
// extractMetadata
//

const extractMetadata = tinycli(
  z.object({
    module: z.string().default(DEFAULT_MODULE_PATH),
    in: z.string(),
  }),
  async (args) => {
    // initialize emscritpen module
    const init: EmscriptenInit = require(path.resolve(args.module));
    const Module: EmscriptenModule = await init();

    // read data
    const inData = new Module.embind_Vector();
    await readFileToVector(inData, args.in);

    // process
    const outData = Module.embind_extractMetadata(inData);
    console.log(outData);
  }
);

//
// utils
//

async function readFileToVector(
  vector: EmbindVector,
  filename: string
): Promise<void> {
  const buffer = await fs.promises.readFile(filename);
  vector.resize(buffer.length, 0);
  vector.view().set(new Uint8Array(buffer));
}

function main() {
  const cli = tinycliMulti({ convert, extractMetadata });
  const args = process.argv.slice(2);
  return cli(args);
}

if (require.main === module) {
  main();
}
