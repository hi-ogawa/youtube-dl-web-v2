import { TinyRpcRoutes } from "@hiogawa/tiny-rpc";
import { zodFn } from "@hiogawa/tiny-rpc/dist/zod";
import { tinyassert } from "@hiogawa/utils";
import { z } from "zod";
import { listAssets } from "../utils/asset-utils";
import { fetchVideoInfo, parseVideoId } from "../utils/youtube-utils";

export const rpcRoutes = {
  getVideoMetadata: zodFn(
    z.object({
      id: z.string(),
    })
  )(async (input) => {
    const id = parseVideoId(input.id);
    tinyassert(id, "invalid video id");

    const videoInfo = await fetchVideoInfo(id);
    return { videoInfo };
  }),

  listAssets: zodFn(
    z.object({
      cursor: z.string().optional(),
      limit: z.number().int().min(1).max(10),
    })
  )(async (input) => {
    return listAssets(input);
  }),
} satisfies TinyRpcRoutes;
