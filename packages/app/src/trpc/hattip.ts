import { RequestHandler } from "@hattip/compose";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { TRPC_ENDPOINT } from "./common";
import { trpcRoot } from "./server";

// integrate trpc as hattip middleware

export const trpcHandler: RequestHandler = async (ctx) => {
  if (!ctx.url.pathname.startsWith(TRPC_ENDPOINT)) {
    return ctx.next();
  }
  return fetchRequestHandler({
    endpoint: TRPC_ENDPOINT,
    req: ctx.request,
    router: trpcRoot,
    createContext: () => ({}),
    onError: (e) => {
      console.error(e);
      const span = trace.getActiveSpan();
      if (span) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.recordException(e.error);
      }
    },
  });
};
