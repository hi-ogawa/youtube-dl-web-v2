import process from "node:process";
import { z } from "zod";
import { initializePublicConfigServer } from "./config-public";

const NODE_ENV = process.env["NODE_ENV"] ?? "development";

// prettier-ignore
const Z_SERVER_CONFIG = z.object({
  // s3
  APP_S3_ENDPOINT: z.string().default("http://localhost:4566"),
  APP_S3_ACCESS_KEY_ID: z.string().default("na"),
  APP_S3_SECRET_ACCESS_KEY: z.string().default("na"),
  APP_S3_REGION: z.string().default("us-east-1"),
  APP_S3_BUCKET: z.string().default(NODE_ENV),

  // captcha
  APP_CAPTCHA_SITE_KEY: z.string().optional(),
  APP_CAPTCHA_SECRET_KEY: z.string().optional(),
});

export const Z_PUBLIC_CONFIG = Z_SERVER_CONFIG.pick({
  APP_CAPTCHA_SITE_KEY: true,
});

export let serverConfig: z.infer<typeof Z_SERVER_CONFIG>;

export function initializeConfig() {
  serverConfig = Z_SERVER_CONFIG.parse(process.env);
  initializePublicConfigServer(Z_PUBLIC_CONFIG.parse(serverConfig));
}
