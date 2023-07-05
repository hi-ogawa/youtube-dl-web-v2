import { RequestHandler, compose } from "@hattip/compose";
import { tinyassert } from "@hiogawa/utils";
import THEME_SCRIPT from "@hiogawa/utils-experimental/dist/theme-script.global.js?raw";
import { globApiRoutes } from "@hiogawa/vite-glob-routes/dist/hattip";
import {
  globPageRoutes,
  handleReactRouterServer,
} from "@hiogawa/vite-glob-routes/dist/react-router";
import { importIndexHtml } from "@hiogawa/vite-import-index-html/dist/runtime";
import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouterProvider } from "react-router-dom/server";
import { rpcHandler } from "../trpc/hattip";
import { injectPublicConfigScript } from "../utils/config-public";
import { initializeServerHandler } from "../utils/server-utils";
import { WORKER_ASSET_URLS } from "../utils/worker-client";
import { WORKER_ASSET_URLS_LIBWEBM } from "../utils/worker-client-libwebm";

export function createHattipEntry() {
  return compose(
    initializeServerHandler(),
    rpcHandler(),
    globApiRoutes(),
    htmlHandler()
  );
}

function htmlHandler(): RequestHandler {
  const { routes } = globPageRoutes();

  return async (ctx) => {
    const routerResult = await handleReactRouterServer({
      routes,
      request: ctx.request,
    });
    tinyassert(routerResult.type === "render");
    const ssrHtml = renderToString(
      <React.StrictMode>
        <StaticRouterProvider
          router={routerResult.router}
          context={routerResult.context}
        />
      </React.StrictMode>
    );

    let html = await importIndexHtml();
    html = html.replace("<!--@INJECT_SSR@-->", ssrHtml);
    html = html.replace("<!--@INJECT_HEAD@-->", injectToHead());
    return new Response(html, {
      status: routerResult.statusCode,
      headers: { "content-type": "text/html" },
    });
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
