import type { KVNamespace } from "@miniflare/kv";

export let env: {
  kv: KVNamespace;
};

export function setWorkerEnv(v: any) {
  env = v;
}

export async function initailizeWorkerEnv() {
  if (import.meta.env.PROD) {
    return;
  }
  const { KVNamespace } = await import("@miniflare/kv");
  const { FileStorage } = await import("@miniflare/storage-file");
  const kv = new KVNamespace(new FileStorage(".wrangler/.vite-dev"));
  env = { kv };
}

//
// about limits
//
// https://developers.cloudflare.com/workers/platform/limits/#request-limits
// request 100MB
// resposne 512 MB
//
// https://developers.cloudflare.com/workers/platform/limits/#kv-limits
// Value size 25 MiB
//
