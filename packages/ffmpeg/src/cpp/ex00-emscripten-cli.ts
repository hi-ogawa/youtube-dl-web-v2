import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { tinyassert } from "../tinyassert";

async function main() {
  // argparse
  const cli = new Cli(process.argv.slice(2));
  const modulePath = cli.getArgument("--module");
  const inFile = cli.getArgument("--in");
  const outFile = cli.getArgument("--out");
  const startTime = Number(cli.getArgument("--start-time") ?? -1);
  const endTime = Number(cli.getArgument("--end-time") ?? -1);
  tinyassert(modulePath);
  tinyassert(inFile);
  tinyassert(outFile);

  // initialize emscritpen module
  const init: EmscriptenInit = require(path.resolve(modulePath));
  const Module: EmscriptenModule = await init();

  const inData = new Module.embind_Vector();
  await readFileToVector(inData, inFile);

  const outData = Module.embind_convert(inData, "opus", startTime, endTime);
  await fs.promises.writeFile(outFile, outData.view());
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
    start_time: number,
    end_time: number
  ) => EmbindVector;
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
