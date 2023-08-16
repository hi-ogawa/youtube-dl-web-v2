import { createFnRecordQueryProxy } from "@hiogawa/query-proxy";
import { httpClientAdapter, proxyTinyRpc } from "@hiogawa/tiny-rpc";
import { rpcRoutes } from "./server";

export const RPC_ENDPOINT = "/trpc";

export const rpcClient = proxyTinyRpc<typeof rpcRoutes>({
  adapter: httpClientAdapter({
    url: RPC_ENDPOINT,
    method: "POST",
  }),
});

export const rpcClientQuery = createFnRecordQueryProxy(rpcClient);
