import { RequestHandler } from "@hattip/compose";
import { createTinyRpcHandler } from "@hiogawa/tiny-rpc";
import { RPC_ENDPOINT } from "./client";
import { rpcRoutes } from "./server";

export function rpcHandler(): RequestHandler {
  const handler = createTinyRpcHandler({
    endpoint: RPC_ENDPOINT,
    routes: rpcRoutes,
  });
  return async (ctx) => {
    if (ctx.url.pathname.startsWith(RPC_ENDPOINT)) {
      return handler(ctx);
    }
    return ctx.next();
  };
}
