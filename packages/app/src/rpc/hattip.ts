import { RequestHandler } from "@hattip/compose";
import { createServerHandler } from "@hiogawa/tiny-rpc";
import { RPC_ENDPOINT } from "./client";
import { rpcRoutes } from "./server";

export function rpcHandler(): RequestHandler {
  const handler = createServerHandler({
    endpoint: RPC_ENDPOINT,
    fnRecord: rpcRoutes,
  });
  return async (ctx) => {
    if (!ctx.url.pathname.startsWith(RPC_ENDPOINT)) {
      return ctx.next();
    }
    return handler({ url: ctx.url, request: ctx.request });
  };
}
