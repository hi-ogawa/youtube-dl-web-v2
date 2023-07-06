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
  // TODO: different storage for "NODE_ENV=test"
  const kv = new KVNamespace(new FileStorage(".wrangler/.vite-dev"));
  env = { kv };
}
