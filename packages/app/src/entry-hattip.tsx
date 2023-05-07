import { compose } from "@hattip/compose";
import { createRequestHandler } from "rakkasjs";
import { renderToString } from "react-dom/server";
import ICON_URL from "./assets/icon-32.png?url";
import { traceRequestHanlder } from "./utils/otel-utils";
import THEME_SCRIPT from "./utils/theme-script.js?raw";
import { WORKER_ASSET_URLS } from "./utils/worker-client";
import { WORKER_ASSET_URLS_LIBWEBM } from "./utils/worker-client-libwebm";

const rakkasHandler = createRequestHandler({
  createPageHooks(_ctx) {
    return {
      emitToDocumentHead() {
        return renderToString(<AppHead />);
      },
    };
  },
});

// rakkasjs <Head /> in layout.tsx seems to have some issue during dev/hmr
function AppHead() {
  return (
    <>
      <link rel="icon" href={ICON_URL} />
      <link rel="manifest" href="/manifest.json" />
      {/* it doesn't have to be so high priority, but don't want to spend time fetching them during instantiating emscripten module */}
      {[...WORKER_ASSET_URLS, ...WORKER_ASSET_URLS_LIBWEBM].map((href) => (
        <link key={href} rel="prefetch" href={href} />
      ))}
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
    </>
  );
}

export default compose(traceRequestHanlder, rakkasHandler);
