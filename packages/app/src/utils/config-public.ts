import { z } from "zod";
import type { Z_PUBLIC_CONFIG } from "./config";

// pass to client via global script
const __publicConfig = "__publicConfig";
const __clientPublicConfig = (globalThis as any)[__publicConfig];

export let publicConfig: z.infer<typeof Z_PUBLIC_CONFIG> = __clientPublicConfig;

export function initializePublicConfigServer(v: typeof publicConfig) {
  publicConfig = v;
}

export function injectPublicConfigScript() {
  return `
<script>
  globalThis.${__publicConfig} = ${JSON.stringify(publicConfig)}
</script>
`;
}
