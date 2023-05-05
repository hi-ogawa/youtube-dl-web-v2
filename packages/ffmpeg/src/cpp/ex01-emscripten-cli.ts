import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { tinyassert } from "@hiogawa/utils";
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
    startTime: z.preprocess(Number, z.number()).optional(),
    endTime: z.preprocess(Number, z.number()).optional(),
    fixTimestamp: z.enum(["true", "false"]).default("true"),
  }),
  async (args) => {
    await initModule(args.module);

    // read metadata
    const inData = await readFile(args.in);
    const outData = Module.embind_parseMetadataWrapper(inData);
    const metadata: SimpleMetadata = JSON.parse(outData);

    // compute containing range
    const cueRange = findContainingRange(
      metadata,
      args.startTime,
      args.endTime
    );

    // slice frame data
    const frameData = new Module.embind_Vector();
    const sliceArray = inData
      .view()
      .slice(cueRange.startByte, cueRange.endByte);
    frameData.resize(sliceArray.length, 0);
    frameData.view().set(sliceArray);

    // process
    const output = Module.embind_remuxWrapper(
      inData,
      frameData,
      args.fixTimestamp === "true"
    );
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

interface ContainingRange {
  // byte offset of containing clusters
  startByte: number;
  endByte?: number;
  // timestamp of first frame (in seconds)
  startTime: number;
}

function findContainingRange(
  metadata: SimpleMetadata,
  startTime?: number,
  endTime?: number
): ContainingRange {
  tinyassert(metadata.segment_body_start);
  tinyassert(metadata.track_entries.length === 1);

  interface StrictCuePont {
    time: number;
    cluster_position: number;
  }
  const cuePoints: StrictCuePont[] = metadata.cue_points.map((c) => {
    const { time, cluster_position } = c;
    tinyassert(typeof time === "number");
    tinyassert(typeof cluster_position === "number");
    return { time: time / 1000, cluster_position };
  });

  const startCue = startTime
    ? [...cuePoints].reverse().find((c) => c.time <= startTime)
    : cuePoints[0];
  const endCue = endTime && cuePoints.find((c) => c.time > endTime);
  tinyassert(startCue);

  return {
    startByte: startCue.cluster_position + metadata.segment_body_start,
    endByte: endCue
      ? endCue.cluster_position + metadata.segment_body_start
      : undefined,
    startTime: startCue.time,
  };
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
