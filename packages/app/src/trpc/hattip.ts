import { RequestHandler } from "@hattip/compose";
import { createTinyRpcHandler } from "@hiogawa/tiny-rpc";
import { RPC_ENDPOINT } from "./client";
import { rpcRoutes } from "./server";

export function rpcHandler(): RequestHandler {
  return createTinyRpcHandler({
    endpoint: RPC_ENDPOINT,
    routes: rpcRoutes,
    onError(e) {
      console.error(e);
    },
  });
}
