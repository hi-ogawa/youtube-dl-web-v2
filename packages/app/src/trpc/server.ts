import { TinyRpcRoutes } from "@hiogawa/tiny-rpc";
import { zodFn } from "@hiogawa/tiny-rpc/dist/zod";
import { tinyassert } from "@hiogawa/utils";
import { z } from "zod";
import {
  getAssetDownloadUrl,
  getAssetUploadPost,
  getAssetUploadPutUrl,
  listAssets,
} from "../utils/s3-utils";
import { verifyTurnstile } from "../utils/turnstile-utils-server";
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

  getAssetUploadPutUrl: zodFn(
    z.object({
      filename: z.string(),
      contentType: z.string(),
      videoId: z.string(),
      artist: z.string().optional(),
      title: z.string().optional(),
      token: z.string(),
    })
  )(async (input) => {
    await verifyTurnstile({ response: input.token });

    const timestamp = new Date();
    const sortKey = createDateDescSortKey(timestamp);
    return getAssetUploadPutUrl({
      sortKey,
      filename: input.filename,
      contentType: input.contentType,
      videoId: input.videoId,
      artist: input.artist,
      title: input.title,
    });
  }),

  getAssetUploadPost: zodFn(
    z.object({
      filename: z.string(),
      contentType: z.string(),
      videoId: z.string(),
      artist: z.string().optional(),
      title: z.string().optional(),
    })
  )(async (input) => {
    const timestamp = new Date();
    const sortKey = createDateDescSortKey(timestamp);
    return getAssetUploadPost({
      sortKey,
      filename: input.filename,
      contentType: input.contentType,
      videoId: input.videoId,
      artist: input.artist,
      title: input.title,
    });
  }),

  getDownloadUrl: zodFn(
    z.object({
      key: z.string(),
    })
  )(async (input) => {
    return getAssetDownloadUrl({ key: input.key });
  }),
} satisfies TinyRpcRoutes;

//
// utils
//

function createDateDescSortKey(date: Date): string {
  return (Number.MAX_SAFE_INTEGER - date.getTime())
    .toString(16)
    .padStart(16, "0");
}
