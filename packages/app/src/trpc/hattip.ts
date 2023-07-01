import { RequestHandler } from "@hattip/compose";
import { createTinyRpcHandler } from "@hiogawa/tiny-rpc";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import { RPC_ENDPOINT } from "./client";
import { rpcRoutes } from "./server";

export function rpcHandler(): RequestHandler {
  const handler = createTinyRpcHandler({
    endpoint: RPC_ENDPOINT,
    routes: rpcRoutes,
    onError(e) {
      console.error(e);
      const span = trace.getActiveSpan();
      if (span) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.recordException(e instanceof Error ? e : new Error());
      }
    },
  });
  return async (ctx) => {
    if (ctx.url.pathname.startsWith(RPC_ENDPOINT)) {
      return handler(ctx);
    }
    return ctx.next();
  };
}
