import { RequestHandler, compose } from "@hattip/compose";
import { once } from "@hiogawa/utils";
import { loggerMiddleware } from "@hiogawa/utils-experimental";
import THEME_SCRIPT from "@hiogawa/utils-experimental/dist/theme-script.global.js?raw";
import { globApiRoutes } from "@hiogawa/vite-glob-routes/dist/hattip";
import { importIndexHtml } from "@hiogawa/vite-import-index-html/dist/runtime";
import { rpcHandler } from "../trpc/hattip";
import { initializeServerHandler } from "../utils/server-utils";
import { WORKER_ASSET_URLS } from "../utils/worker-client";
import { WORKER_ASSET_URLS_LIBWEBM } from "../utils/worker-client-libwebm";
import { initailizeWorkerEnv } from "../utils/worker-env";

export function createHattipEntry() {
  return compose(
    loggerMiddleware(),
    bootstrapHandler(),
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
    `
    <script>
      globalThis.__themeStorageKey = "youtube-dl-web:theme";
      globalThis.__themeDefault = "dark";
      ${THEME_SCRIPT}
    </script>
    `,
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
  });
}
