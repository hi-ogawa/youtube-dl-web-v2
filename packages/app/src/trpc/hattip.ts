import { RequestHandler } from "@hattip/compose";
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
    // quick error logging
    onError: (e) => {
      console.error(e);
    },
  });
};
