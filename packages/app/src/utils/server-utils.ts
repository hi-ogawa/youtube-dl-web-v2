import { RequestHandler } from "@hattip/compose";
import { once } from "@hiogawa/utils";
import { initializeConfig } from "./config";
import { initializeOtel } from "./otel-utils";
import { initializeS3 } from "./s3-utils";

export async function initializeServer() {
  await initializeOtel();
  initializeConfig();
  initializeS3();
}

const initializeServerOnce = once(initializeServer);

export const initializeServerHandler: RequestHandler = async (ctx) => {
  await initializeServerOnce();
  return ctx.next();
};
