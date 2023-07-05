import { tinyassert } from "@hiogawa/utils";
import { z } from "zod";
import { workerEnv } from "./worker-env";

// persist uploaded audio file on KV
// https://developers.cloudflare.com/workers/runtime-apis/kv/#metadata
// https://developers.cloudflare.com/workers/runtime-apis/kv/#ordering

// TODO: simplify after R2 -> KV migration
const Z_ASSET_CREATE = z.object({
  sortKey: z.string().regex(/^[0-9a-z]*$/),
  filename: z.string(),
  contentType: z.string(),
  videoId: z.string(),
  title: z.string().optional(),
  artist: z.string().optional(),
});

type AssetCreate = z.infer<typeof Z_ASSET_CREATE>;

export type Asset = { key: string } & AssetCreate;

export async function putAsset(asset: any, data: ReadableStream) {
  // workaround stream typing
  await workerEnv.kv.put(
    asset.key,
    data as import("node:stream/web").ReadableStream
  );
}

export async function getAsset(asset: any) {
  const data = await workerEnv.kv.get(asset.key, "stream");
  tinyassert(data, "asset not found");
  // TODO: Response header etc...
  return data as ReadableStream;
}

export async function listAssets({
  limit,
  cursor,
}: {
  limit: number;
  cursor?: string;
}): Promise<{ assets: Asset[]; nextCursor?: string }> {
  const result = await workerEnv.kv.list({ limit, cursor });
  const assets = result.keys.map((e) => {
    const metadata = Z_ASSET_CREATE.parse(e.metadata);
    return {
      key: e.name,
      ...metadata,
    } satisfies Asset;
  });
  return {
    assets,
    nextCursor: result.list_complete ? undefined : result.cursor,
  };
}

// TODO: sign and verify to avoid abuse?
const PARAM_KEY = "asset";

export function encodeAssetUploadUrl(asset: any): string {
  return (
    "/api/assets/upload?" +
    new URLSearchParams({ asset: JSON.stringify(asset) })
  );
}

export function decodeAssetUploadUrl(url: URL): any {
  const value = url.searchParams.get(PARAM_KEY);
  tinyassert(value);
  return JSON.parse(value);
}

export function encodeAssetDownloadUrl(asset: any): string {
  return (
    "/api/assets/download?" +
    new URLSearchParams({ asset: JSON.stringify(asset) })
  );
}

export function decodeAssetDownloadUrl(url: URL): any {
  const value = url.searchParams.get(PARAM_KEY);
  tinyassert(value);
  return JSON.parse(value);
}
