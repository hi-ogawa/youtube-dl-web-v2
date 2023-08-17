import { RequestHandler } from "@hattip/compose";
import {
  TinyRpcRoutes,
  exposeTinyRpc,
  httpServerAdapter,
  validateFn,
} from "@hiogawa/tiny-rpc";
import { tinyassert } from "@hiogawa/utils";
import { z } from "zod";
import { listAssets } from "../utils/asset-utils";
import { fetchVideoInfo, parseVideoId } from "../utils/youtube-utils";
import { RPC_ENDPOINT } from "./client";

export const rpcRoutes = {
  getVideoMetadata: validateFn(
    z.object({
      id: z.string(),
    })
  )(async (input) => {
    const id = parseVideoId(input.id);
    tinyassert(id, "invalid video id");

    const videoInfo = await fetchVideoInfo(id);
    return { videoInfo };
  }),

  listAssets: validateFn(
    z.object({
      cursor: z.string().optional(),
      limit: z.number().int().min(1).max(10),
    })
  )(async (input) => {
    return listAssets(input);
  }),
} satisfies TinyRpcRoutes;

export function rpcHandler(): RequestHandler {
  return exposeTinyRpc({
    routes: rpcRoutes,
    adapter: httpServerAdapter({
      endpoint: RPC_ENDPOINT,
      method: "POST",
      onError(e) {
        console.error(e);
      },
    }),
  });
}
