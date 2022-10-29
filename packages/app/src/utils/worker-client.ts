import { UseQueryOptions, useQuery } from "@tanstack/react-query";
import { Remote, wrap } from "comlink";
import _, { pick } from "lodash";
import type { WorkerImpl } from "./worker-impl";
import WorkerConstructor from "./worker-impl?worker";

export const getWorker = _.memoize(async () => {
  const worker = wrap<WorkerImpl>(new WorkerConstructor());
  await worker.initialize();
  return worker;
});

export function useWorker(options?: UseQueryOptions<Remote<WorkerImpl>>) {
  return useQuery({
    queryKey: [useWorker.name],
    queryFn: () => getWorker(),
    staleTime: Infinity,
    cacheTime: Infinity,
    ...options,
  });
}

export interface ProcessFileArg {
  audio: Uint8Array;
  image?: Uint8Array;
  title?: string;
  artist?: string;
  album?: string;
}

export async function processFile(
  worker: Remote<WorkerImpl>,
  arg: ProcessFileArg
): Promise<{ url: string; name: string }> {
  const output = await worker.convert({
    data: arg.audio,
    outFormat: "opus",
    picture: arg.image,
    metadata: pick(arg, "title", "artist", "album"),
  });
  const url = URL.createObjectURL(new Blob([output]));
  const name =
    ([arg.artist, arg.album, arg.title].filter(Boolean).join(" - ") ||
      "download") + ".opus";
  return { url, name };
}
