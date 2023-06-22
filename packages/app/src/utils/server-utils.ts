import { RequestHandler } from "@hattip/compose";
import { once } from "@hiogawa/utils";
import { initializeConfig } from "./config";
import { finalizeOtel, initializeOtel } from "./otel-utils";
import { initializeS3 } from "./s3-utils";

export async function initializeServer() {
  await initializeOtel();
  initializeConfig();
  initializeS3();
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
