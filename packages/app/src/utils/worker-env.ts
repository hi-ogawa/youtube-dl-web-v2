import type { KVNamespace } from "@miniflare/kv";
import { wrapTraceAsync } from "./opentelemetry";

export let env: {
  kv: KVNamespace;
  OTEL_SERVICE_NAME?: string;
  OTEL_TRACES_EXPORTER?: string;
  OTEL_EXPORTER_OTLP_ENDPOINT?: string;
  OTEL_EXPORTER_OTLP_TRACES_HEADERS?: string;
} = {} as any;

export function setWorkerEnv(v: any) {
  env = v;
}

export async function initailizeWorkerEnv() {
  if (!import.meta.env.PROD) {
    await setWorkerEnvLocal();
  }
  setupTrace();
}

async function setWorkerEnvLocal() {
  const process = await import("node:process");
  Object.assign(env, process.env);

  // https://github.com/cloudflare/miniflare/pull/639
  // https://github.com/honojs/vite-plugins/blob/main/packages/dev-server/src/dev-server.ts

  const { Miniflare } = await import("miniflare");
  const miniflare = new Miniflare({
    modules: true,
    script: `export default { fetch: () => new Response(null, { status: 404 }) }`,
    kvNamespaces: ["kv"],
    kvPersist: ".wrangler/.vite-dev",
  });
  const bindings = await miniflare.getBindings();
  Object.assign(env, bindings);

  // TODO: different storage for "NODE_ENV=test"
  // const { KVNamespace } = await import("@miniflare/kv");
  // const { FileStorage } = await import("@miniflare/storage-file");
  // env.kv = new KVNamespace(new FileStorage(".wrangler/.vite-dev"));
}

// prettier-ignore
function setupTrace() {
  env.kv.list = wrapTraceAsync(env.kv.list, () => ({ name: "kv.list" }));
  env.kv.get = wrapTraceAsync(env.kv.get, () => ({ name: "kv.get" }));
  env.kv.getWithMetadata = wrapTraceAsync(env.kv.getWithMetadata, () => ({ name: "kv.getWithMetadata" }));
  env.kv.put = wrapTraceAsync(env.kv.put, () => ({ name: "kv.put" }));
  env.kv.delete = wrapTraceAsync(env.kv.delete, () => ({ name: "kv.delete" }));
}
