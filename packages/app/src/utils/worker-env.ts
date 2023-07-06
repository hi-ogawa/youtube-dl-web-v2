import type { KVNamespace } from "@miniflare/kv";

export let env: {
  kv: KVNamespace;
  OTEL_SERVICE_NAME?: string;
  OTEL_TRACES_EXPORTER?: string;
};

export function setWorkerEnv(v: any) {
  env = v;
}

export async function initailizeWorkerEnv() {
  if (import.meta.env.PROD) {
    return;
  }
  const process = await import("node:process");
  env = process.env as any;

  const { KVNamespace } = await import("@miniflare/kv");
  const { FileStorage } = await import("@miniflare/storage-file");
  // TODO: different storage for "NODE_ENV=test"
  env.kv = new KVNamespace(new FileStorage(".wrangler/.vite-dev"));
}
