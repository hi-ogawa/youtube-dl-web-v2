import { RequestHandler } from "@hattip/compose";
import { once } from "@hiogawa/utils";

export async function initializeServer() {}

export async function finalizeServer() {}

export function initializeServerHandler(): RequestHandler {
  const initializeServerOnce = once(initializeServer);
  return async (ctx) => {
    await initializeServerOnce();
    return ctx.next();
  };
}
