import { NotFoundError, getAssetFromKV } from "@cloudflare/kv-asset-handler";
import __STATIC_CONTENT_MANIFEST from "__STATIC_CONTENT_MANIFEST";
import { createHattipEntry } from ".";
import { setWorkerEnv } from "../utils/worker-env";

// cf.
// https://github.com/remix-run/remix/blob/fbc6e2353b4ef2c2166677b39b7fbd8eb90a5379/templates/cloudflare-workers/server.ts#L11-L14
// https://github.com/hattipjs/hattip/blob/03a704fa120dfe2eddd6cf22eff00c90bda2acb5/packages/adapter/adapter-cloudflare-workers/src/index.ts#L17-L18

export default {
  fetch: createFetchHandler(),
};

function createFetchHandler() {
  const hattipHandler = createHattipEntry();
  const manifest = JSON.parse(__STATIC_CONTENT_MANIFEST);

  return async (
    request: Request,
    env: unknown,
    ctx: unknown
  ): Promise<Response> => {
    setWorkerEnv(env);

    const waitUntil = (ctx as any).waitUntil.bind(ctx);

    if (request.method === "GET" || request.method === "HEAD") {
      try {
        return await getAssetFromKV(
          {
            request,
            waitUntil,
          },
          {
            ASSET_NAMESPACE: (env as any).__STATIC_CONTENT,
            ASSET_MANIFEST: manifest,
            cacheControl: {
              browserTTL: 60 * 60 * 24 * 365,
              edgeTTL: 60 * 60 * 24 * 365,
            },
          }
        );
      } catch (e) {
        if (!(e instanceof NotFoundError)) {
          return new Response(
            [
              "ERROR: getAssetFromKV",
              e instanceof Error && (e.stack ?? e.message),
            ]
              .filter(Boolean)
              .join("\n"),
            { status: 500 }
          );
        }
      }
    }

    return hattipHandler({
      request,
      waitUntil,
      ip: request.headers.get("cf-connection-ip") || "",
      platform: { env },
      passThrough() {
        throw new Error("hattip passThrough unsupported");
      },
    });
  };
}
