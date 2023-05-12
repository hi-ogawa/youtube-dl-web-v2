import { RequestHandler, compose } from "@hattip/compose";
import THEME_SCRIPT from "@hiogawa/utils-experimental/dist/theme-script.global.js?raw";
import { createRequestHandler } from "rakkasjs";
import { renderToString } from "react-dom/server";
import ICON_URL from "./assets/icon-32.png?url";
import { traceRequestHanlder } from "./utils/otel-utils";
import { initializeServer } from "./utils/server-utils";
import { WORKER_ASSET_URLS } from "./utils/worker-client";
import { WORKER_ASSET_URLS_LIBWEBM } from "./utils/worker-client-libwebm";

//
// rakkas
//

const rakkasHandler = createRequestHandler({
  createPageHooks(_ctx) {
    return {
      emitToDocumentHead() {
        return renderToString(<AppHead />);
      },
    };
  },
});

// rakkasjs <Head /> doesn't support link, script, etc...
function AppHead() {
  return (
    <>
      <link rel="icon" href={ICON_URL} />
      <link rel="manifest" href="/manifest.json" />
      {/* it doesn't have to be so high priority, but don't want to spend time fetching them during instantiating emscripten module */}
      {[...WORKER_ASSET_URLS, ...WORKER_ASSET_URLS_LIBWEBM].map((href) => (
        <link key={href} rel="prefetch" href={href} />
      ))}
      {/* early theme initialization on client */}
      <script
        dangerouslySetInnerHTML={{
          __html: `\
globalThis.__themeStorageKey = "youtube-dl-web:theme";
globalThis.__themeDefault = "dark";
${THEME_SCRIPT}
`,
        }}
      />
    </>
  );
}

//
// one-time server initialization
//

const initializeServerHandler: RequestHandler = async (ctx) => {
  await initializeServer();
  return ctx.next();
};

//
// main handler
//

export default compose(
  initializeServerHandler,
  traceRequestHanlder,
  rakkasHandler
);
