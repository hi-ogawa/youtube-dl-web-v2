import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { EmptyFileInfo, FileInfo, run } from ".";
import { wrapError } from "./result";
import { tinyassert } from "./tinyassert";

const HELP_MESSAGE = `
usage:
  ffmpeg-emscripten (file-map ...) -- (ffmpeg command)
    where
      (file-map) = (-i/-o):(local-path):(emscripten-virtual-path)

example:
  ffmpeg-emscripten -i=test.webm:/x.webm -o=test.opus:/y.opus -- -i /x.webm -c copy /y.opus
`;

async function main() {
  const args = wrapError(() => parseArgs(process.argv.slice(2)));
  if (!args.ok) {
    console.error(HELP_MESSAGE.trimStart());
    throw args.value;
  }

  const inFiles: FileInfo[] = [];
  const outFiles: EmptyFileInfo[] = [];
  for (const [localPath, emscriptenPath] of args.value.inMap) {
    const data = await fs.promises.readFile(localPath);
    inFiles.push({
      path: emscriptenPath,
      data,
    });
  }
  for (const [_, emscriptenPath] of args.value.outMap) {
    outFiles.push({
      path: emscriptenPath,
    });
  }

  const modulePath = getFFmepgModulePath();
  const result = await run({
    initModule: require(modulePath),
    moduleUrl: modulePath,
    wasmUrl: path.join(modulePath, "..", "ffmpeg_g.wasm"),
    workerUrl: path.join(modulePath, "..", "ffmpeg_g.worker.js"),
    arguments: args.value.ffmpegArgs,
    inFiles,
    outFiles,
  });

  process.exitCode = result.exitCode;
  if (result.exitCode === 0) {
    for (const [localPath, emscriptenPath] of args.value.outMap) {
      const file = result.outFiles.find((f) => f.path === emscriptenPath);
      tinyassert(file);
      await fs.promises.writeFile(localPath, file.data);
    }
  }
}

interface Args {
  inMap: [string, string][];
  outMap: [string, string][];
  ffmpegArgs: string[];
}

const FILE_MAP_RE = /^-(i|o)=(.+):(.+)$/;

function parseArgs(args: string[]): Args {
  const split = args.indexOf("--");
  tinyassert(split !== -1);

  const result: Args = {
    inMap: [],
    outMap: [],
    ffmpegArgs: args.slice(split + 1),
  };
  for (let arg of args.slice(0, split)) {
    const match = arg.match(FILE_MAP_RE);
    tinyassert(match);
    const [, io, from, to] = match;
    if (io === "i") {
      result.inMap.push([from, to]);
      continue;
    }
    if (io === "o") {
      result.outMap.push([from, to]);
      continue;
    }
    tinyassert(false);
  }

  return result;
}

function getFFmepgModulePath(): string {
  let packageDir: string;
  if (__filename.endsWith("cli.cjs")) {
    packageDir = path.dirname(path.dirname(__dirname));
  } else if (__filename.endsWith("cli.ts")) {
    packageDir = path.dirname(__dirname);
  } else {
    throw new Error("getFFmepgModulePath failure");
  }
  return path.join(packageDir, "build", "emscripten", "ffmpeg", "ffmpeg_g.js");
}

main();
