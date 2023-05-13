import { createTRPCProxyClient, httpLink } from "@trpc/client";
import { TRPC_ENDPOINT } from "./common";
import type { trpcRoot } from "./server";

export const trpcClient = createTRPCProxyClient<typeof trpcRoot>({
  links: [
    httpLink({
      url: TRPC_ENDPOINT,
    }),
  ],
});
