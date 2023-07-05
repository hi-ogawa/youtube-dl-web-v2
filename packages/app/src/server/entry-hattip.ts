import { RequestHandler, compose } from "@hattip/compose";
import { once } from "@hiogawa/utils";
import { loggerMiddleware } from "@hiogawa/utils-experimental";
import THEME_SCRIPT from "@hiogawa/utils-experimental/dist/theme-script.global.js?raw";
import { globApiRoutes } from "@hiogawa/vite-glob-routes/dist/hattip";
import { importIndexHtml } from "@hiogawa/vite-import-index-html/dist/runtime";
import { rpcHandler } from "../trpc/hattip";
import { injectPublicConfigScript } from "../utils/config-public";
import { initializeServerHandler } from "../utils/server-utils";
import { WORKER_ASSET_URLS } from "../utils/worker-client";
import { WORKER_ASSET_URLS_LIBWEBM } from "../utils/worker-client-libwebm";
import { initailizeWorkerEnv } from "../utils/worker-env";

export function createHattipEntry() {
  return compose(
    loggerMiddleware(),
    import.meta.env.DEV && serveStaticHandler(),
    bootstrapHandler(),
    initializeServerHandler(),
    rpcHandler(),
    globApiRoutes(),
    htmlHandler()
  );
}

function serveStaticHandler(options?: { root?: string }): RequestHandler {
  const root = options?.root ?? "public";
  return async (ctx) => {
    const nodeFs = await import("node:fs");
    const filePath = root + ctx.url.pathname;
    try {
      // nodeFs.exi
      // TODO
      // handle.close()
      const handle = await nodeFs.promises.open(filePath, "r");
      const stat = await handle.stat();
      if (!stat.isDirectory()) {
        // workaround typing
        const stream = handle.readableWebStream() as ReadableStream;
        return new Response(stream, {
          status: 200,
          headers: {
            // TODO: mime-type
            // "content-type": "",
          }
        });
      }
    } catch (e) {
      if (e instanceof Error && "code" in e && e.code === "ENOENT") {
        return;
      }
      throw e
    }
    return;
  }
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
    injectPublicConfigScript(),
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
