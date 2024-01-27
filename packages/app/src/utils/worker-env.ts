import type { KVNamespace } from "@cloudflare/workers-types";
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
  if (import.meta.env.DEV) {
    await setWorkerEnvLocal();
  }
  setupTrace();
}

async function setWorkerEnvLocal() {
  // TODO: dispose
  const { getBindingsProxy } = await import("wrangler");
  const { bindings } = await getBindingsProxy();
  Object.assign(env, bindings);
  env.OTEL_TRACES_EXPORTER = ""; // disable it for now
}

// prettier-ignore
function setupTrace() {
  env.kv.list = wrapTraceAsync(env.kv.list, () => ({ name: "kv.list" }));
  env.kv.get = wrapTraceAsync(env.kv.get, () => ({ name: "kv.get" }));
  env.kv.getWithMetadata = wrapTraceAsync(env.kv.getWithMetadata, () => ({ name: "kv.getWithMetadata" }));
  env.kv.put = wrapTraceAsync(env.kv.put, () => ({ name: "kv.put" }));
  env.kv.delete = wrapTraceAsync(env.kv.delete, () => ({ name: "kv.delete" }));
}
