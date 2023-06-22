import globApiRoutes from "virtual:glob-api-routes/hattip";
import { RequestHandler, compose } from "@hattip/compose";
import THEME_SCRIPT from "@hiogawa/utils-experimental/dist/theme-script.global.js?raw";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { TRPC_ENDPOINT } from "../trpc/common";
import { trpcRoot } from "../trpc/server";
import { injectPublicConfigScript } from "../utils/config-public";
import { initializeServerHandler2 } from "../utils/server-utils";

export function createHattipEntry() {
  return compose(
    initializeServerHandler2(),
    trpcHanlder(),
    globApiRoutes(),
    indexHtmlHanlder()
  );
}

//
// handle index.html for SPA
//

const INJECT_DEV_VITE_SCRIPT = `
<script type="module">
  import RefreshRuntime from "/@react-refresh"
  RefreshRuntime.injectIntoGlobalHook(window)
  window.$RefreshReg$ = () => {}
  window.$RefreshSig$ = () => (type) => type
  window.__vite_plugin_react_preamble_installed__ = true
</script>
<script type="module" src="/@vite/client"></script>
`;

const INJECT_THEME_SCRIPT = `
<script>
  globalThis.__themeStorageKey = "youtube-dl-web:theme";
  globalThis.__themeDefault = "dark";
  ${THEME_SCRIPT}
</script>
`;

function indexHtmlHanlder(): RequestHandler {
  return async () => {
    // a bit scary but it seems to work thanks to dead code elination and two step build `vite build && vite build --ssr`
    let { default: html } = await (import.meta.env.DEV
      ? import("/index.html?raw")
      : import("/dist/client/index.html?raw"));

    if (import.meta.env.DEV) {
      html = html.replace(
        "<!--@INJECT_DEV_VITE_SCRIPT@-->",
        INJECT_DEV_VITE_SCRIPT
      );
    }

    html = html.replace("<!--@INJECT_THEME_SCRIPT@-->", INJECT_THEME_SCRIPT);

    html = html.replace(
      "<!--@INJECT_PUBLIC_CONFIG_SCRIPT@-->",
      injectPublicConfigScript()
    );

    return new Response(html, {
      headers: [["content-type", "text/html"]],
    });
  };
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
