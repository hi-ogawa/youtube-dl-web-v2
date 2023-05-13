import { RequestHandler } from "@hattip/compose";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { decorateTraceAsync } from "../utils/otel-utils";
import { TRPC_ENDPOINT } from "./common";
import { trpcRoot } from "./server";

// integrate trpc as hattip middleware

export const trpcHandler: RequestHandler = async (ctx) => {
  if (!ctx.url.pathname.startsWith(TRPC_ENDPOINT)) {
    return ctx.next();
  }
  return trpcHandlerInnerTraced(ctx);
};

const trpcHandlerInner: RequestHandler = async (ctx) => {
  return fetchRequestHandler({
    endpoint: TRPC_ENDPOINT,
    req: ctx.request,
    router: trpcRoot,
    createContext: () => ({}),
    // quick error logging
    onError: (e) => {
      console.error(e);
    },
  });
};

const trpcHandlerInnerTraced = decorateTraceAsync(trpcHandlerInner, (ctx) => {
  const procedure = ctx.url.pathname.slice("/trpc".length);
  const type = ctx.request.method === "GET" ? "query" : "mutation";
  const spanName = `trpc-${type} ${procedure}`;
  return { spanName };
});
