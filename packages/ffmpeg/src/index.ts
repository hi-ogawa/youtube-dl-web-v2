export interface FileInfo {
  path: string;
  data: Uint8Array;
}

export type EmptyFileInfo = Omit<FileInfo, "data">;

export interface RunOptions {
  // emscripten module and assets
  initModule: (args: any) => Promise<any>;
  moduleUrl: string;
  wasmUrl: string;
  workerUrl: string;
  // command input
  arguments: string[];
  inFiles: FileInfo[];
  outFiles: EmptyFileInfo[];
  // log callback
  onStdout?: (data: any) => void;
  onStderr?: (data: any) => void;
}

export interface RunResult {
  exitCode: number;
  outFiles: FileInfo[];
}

export async function run(options: RunOptions): Promise<RunResult> {
  let exitCodeResolve: (value: number) => void;
  const exitCodePromise = new Promise<number>((resolve) => {
    exitCodeResolve = resolve;
  });

  const Module = await options.initModule({
    noInitialRun: true,
    quit: (exitCode: number) => {
      exitCodeResolve(exitCode);
    },
    print: (data: any) => {
      (options.onStdout ?? console.log)(data);
    },
    printErr: (data: any) => {
      (options.onStderr ?? console.log)(data);
    },
    // https://github.com/emscripten-core/emscripten/issues/14089#issuecomment-880292535
    mainScriptUrlOrBlob: options.moduleUrl,
    locateFile: (filename: string) => {
      if (filename === "ffmpeg_g.wasm") {
        return options.wasmUrl;
      }
      if (filename === "ffmpeg_g.worker.js") {
        return options.workerUrl;
      }
      throw new Error("[locateFile] invalid filename: " + filename);
    },
  });
  const { callMain, FS, PThread } = Module;

  // copy files to emscripten
  for (const { path, data } of options.inFiles) {
    FS.writeFile(path, data);
  }

  // invoke ffmpeg main and wait until finish
  callMain(options.arguments);
  const exitCode = await exitCodePromise;
  const outFiles: FileInfo[] = [];

  // copy files from emscripten
  if (exitCode === 0) {
    for (const { path } of options.outFiles) {
      const data = FS.readFile(path);
      outFiles.push({
        path,
        data: new Uint8Array(data),
      });
    }
  }

  // cleanup hanging pthread workers
  PThread.terminateAllThreads();

  return { exitCode, outFiles };
}
