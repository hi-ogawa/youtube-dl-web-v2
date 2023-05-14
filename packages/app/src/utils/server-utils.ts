import { RequestHandler } from "@hattip/compose";
import { once } from "@hiogawa/utils";
import { initializeConfig } from "./config";
import { initializeS3 } from "./s3-utils";

export const initializeServer = once(async () => {
  initializeConfig();
  initializeS3();
});

export const initializeServerHandler: RequestHandler = async (ctx) => {
  await initializeServer();
  return ctx.next();
};
