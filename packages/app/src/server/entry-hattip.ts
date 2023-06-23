import globApiRoutes from "virtual:glob-api-routes/hattip";
import indexHtmlMiddleware from "virtual:index-html-middleware/hattip";
import { RequestHandler, compose } from "@hattip/compose";
import THEME_SCRIPT from "@hiogawa/utils-experimental/dist/theme-script.global.js?raw";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { TRPC_ENDPOINT } from "../trpc/common";
import { trpcRoot } from "../trpc/server";
import { injectPublicConfigScript } from "../utils/config-public";
import { initializeServerHandler } from "../utils/server-utils";
import { WORKER_ASSET_URLS } from "../utils/worker-client";
import { WORKER_ASSET_URLS_LIBWEBM } from "../utils/worker-client-libwebm";

export function createHattipEntry() {
  return compose(
    initializeServerHandler(),
    trpcHanlder(),
    globApiRoutes(),
    indexHtmlMiddleware({ injectToHead })
  );
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

//
// trpc
//

function trpcHanlder(): RequestHandler {
  return (ctx) => {
    if (ctx.url.pathname.startsWith(TRPC_ENDPOINT)) {
      return fetchRequestHandler({
        endpoint: TRPC_ENDPOINT,
        req: ctx.request,
        router: trpcRoot,
        createContext: (ctx) => ctx,
        onError: (e) => {
          console.error(e);
        },
      });
    }
    return ctx.next();
  };
}
