import process from "node:process";
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

const initializeServerOnce = once(initializeServer);

export function initializeServerHandler2(): RequestHandler {
  const initializeServerOnce = once(initializeServer);
  return async (ctx) => {
    await initializeServerOnce();
    return ctx.next();
  };
}

export const initializeServerHandler: RequestHandler = async (ctx) => {
  await initializeServerOnce();
  return ctx.next();
};

export function setupFianlizeServer() {
  // TODO: not sure if this works on vercel's aws lambda (cf. https://github.com/aws-samples/graceful-shutdown-with-aws-lambda)

  async function handler(signal: string) {
    console.log(`handling signal '${signal}'`);
    await finalizeServer();
    process.exit(0);
  }

  const signals = ["SIGTERM", "SIGINT"];
  for (const signal of signals) {
    process.on(signal, () => {
      handler(signal);
    });
  }
}
