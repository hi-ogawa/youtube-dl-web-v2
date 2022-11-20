import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { z } from "zod";
import { tinycli, tinycliMulti } from "../tinycli";
import type {
  EmbindVector,
  EmscriptenInit,
  EmscriptenModule,
  SimpleMetadata,
} from "./ex01-emscripten-types";

const DEFAULT_MODULE_PATH = "build/emscripten/Release/ex01-emscripten.js";

let Module: EmscriptenModule;

async function initModule(modulePath: string) {
  const init: EmscriptenInit = require(path.resolve(modulePath));
  Module = await init();
}

const parseMetadata = tinycli(
  z.object({
    module: z.string().default(DEFAULT_MODULE_PATH),
    in: z.string(),
    slice: z.preprocess(Number, z.number().int()).optional(),
  }),
  async (args) => {
    await initModule(args.module);

    // read data and slice
    const inData = await readFile(args.in);
    if (typeof args.slice === "number") {
      inData.resize(args.slice, 0);
    }

    // process
    const outData = Module.embind_parseMetadataWrapper(inData);
    const metadata: SimpleMetadata = JSON.parse(outData);
    console.log(metadata);
  }
);

const remux = tinycli(
  z.object({
    module: z.string().default(DEFAULT_MODULE_PATH),
    in: z.string(),
    out: z.string(),
    sliceStart: z.preprocess(Number, z.number().int()).optional(),
    sliceEnd: z.preprocess(Number, z.number().int()).optional(),
  }),
  async (args) => {
    await initModule(args.module);

    // read data
    const inData = await readFile(args.in);

    // slice frame
    const frameData = new Module.embind_Vector();
    const sliceArray = inData.view().slice(args.sliceStart, args.sliceEnd);
    frameData.resize(sliceArray.length, 0);
    frameData.view().set(sliceArray);

    // process
    const output = Module.embind_remuxWrapper(inData, frameData);
    await fs.promises.writeFile(args.out, output.view());
  }
);

//
// utils
//

async function readFile(filename: string): Promise<EmbindVector> {
  const buffer = await fs.promises.readFile(filename);
  const vector = new Module.embind_Vector();
  vector.resize(buffer.length, 0);
  vector.view().set(new Uint8Array(buffer));
  return vector;
}

//
// main
//

function main() {
  const cli = tinycliMulti({ parseMetadata, remux });
  const args = process.argv.slice(2);
  return cli(args);
}

if (require.main === module) {
  main();
}
