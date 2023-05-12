import process from "node:process";
import { z } from "zod";

const NODE_ENV = process.env["NODE_ENV"] ?? "development";

// prettier-ignore
const Z_SERVER_CONFIG = z.object({
  APP_S3_ENDPOINT: z.string().default("http://localhost:4566"),
  APP_S3_ACCESS_KEY_ID: z.string().default("na"),
  APP_S3_SECRET_ACCESS_KEY: z.string().default("na"),
  APP_S3_REGION: z.string().default("us-east-1"),
  APP_S3_BUCKET: z.string().default(NODE_ENV),
});

export let serverConfig: z.infer<typeof Z_SERVER_CONFIG>;

export function initializeConfig() {
  serverConfig = Z_SERVER_CONFIG.parse(process.env);
}
