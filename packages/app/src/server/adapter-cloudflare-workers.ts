import { createHattipEntry } from ".";
import { setWorkerEnv } from "../utils/worker-env";

export default {
  fetch: createFetchHandler(),
};

function createFetchHandler() {
  const hattipHandler = createHattipEntry();

  return async (
    request: Request,
    env: unknown,
    ctx: unknown
  ): Promise<Response> => {
    setWorkerEnv(env);

    return hattipHandler({
      request,
      waitUntil: (ctx as any).waitUntil.bind(ctx),
      ip: request.headers.get("cf-connection-ip") || "",
      platform: { env },
      passThrough() {
        throw new Error("hattip passThrough unsupported");
      },
    });
  };
}
