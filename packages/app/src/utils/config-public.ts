import { z } from "zod";
import type { Z_PUBLIC_CONFIG } from "./config";

export let publicConfig: z.infer<typeof Z_PUBLIC_CONFIG>;

export function initializePublicConfigServer(v: typeof publicConfig) {
  publicConfig = v;
}

// pass to client via globa script
const __publicConfig = "__publicConfig";

export function initializePublicConfigClient() {
  publicConfig = (globalThis as any)[__publicConfig];
}

export function injectPublicConfigScript() {
  return `globalThis.${__publicConfig} = ${JSON.stringify(publicConfig)}`;
}
