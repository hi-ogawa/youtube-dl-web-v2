import { RequestHandler, compose } from "@hattip/compose";
import { once } from "@hiogawa/utils";
import { loggerMiddleware } from "@hiogawa/utils-experimental";
import { globApiRoutes } from "@hiogawa/vite-glob-routes/dist/hattip";
import { importIndexHtml } from "@hiogawa/vite-import-index-html/dist/runtime";
import { rpcHandler } from "../trpc/hattip";
import {
  initializeOpentelemetry,
  traceForceFlushHandler,
  traceRequestHandler,
} from "../utils/opentelemetry";
import { initializeServerHandler } from "../utils/server-utils";
import { WORKER_ASSET_URLS } from "../utils/worker-client";
import { WORKER_ASSET_URLS_LIBWEBM } from "../utils/worker-client-libwebm";
import { initailizeWorkerEnv } from "../utils/worker-env";

export function createHattipEntry() {
  return compose(
    loggerMiddleware(),
    bootstrapHandler(), // bootstrap includes opentelemetry initialization
    traceForceFlushHandler(),
    traceRequestHandler(),
    initializeServerHandler(),
    rpcHandler(),
    globApiRoutes(),
    htmlHandler()
  );
}

function htmlHandler(): RequestHandler {
  return async () => {
    let html = await importIndexHtml();
    html = html.replace("<!--@INJECT_HEAD@-->", injectToHead());
    return new Response(html, { headers: { "content-type": "text/html" } });
  };
}

function injectToHead(): string {
  return [
    [...WORKER_ASSET_URLS, ...WORKER_ASSET_URLS_LIBWEBM].map(
      (href) => `<link rel="prefetch" href="${href}" />`
    ),
  ]
    .flat()
    .join("\n");
}

function bootstrapHandler() {
  return once(async () => {
    await initailizeWorkerEnv();
    await initializeOpentelemetry();
  });
}
