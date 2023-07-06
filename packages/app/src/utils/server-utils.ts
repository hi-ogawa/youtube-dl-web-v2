import { RequestHandler } from "@hattip/compose";
import { once } from "@hiogawa/utils";
import { initializeConfig } from "./config";
import { finalizeOtel, initializeOtel } from "./otel-utils";

export async function initializeServer() {
  await initializeOtel();
  initializeConfig();
}

export async function finalizeServer() {
  await finalizeOtel();
}

export function initializeServerHandler(): RequestHandler {
  const initializeServerOnce = once(initializeServer);
  return async (ctx) => {
    await initializeServerOnce();
    return ctx.next();
  };
}
