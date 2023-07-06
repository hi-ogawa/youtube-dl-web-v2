import { tinyassert } from "@hiogawa/utils";
import { z } from "zod";
import { env } from "./worker-env";

// persist uploaded audio file on KV
// https://developers.cloudflare.com/workers/runtime-apis/kv/#metadata
// https://developers.cloudflare.com/workers/runtime-apis/kv/#ordering

export const Z_ASSET_METADATA = z.object({
  filename: z.string(),
  contentType: z.string(),
  videoId: z.string(),
  title: z.string().optional(),
  artist: z.string().optional(),
});

export type AssetMetadata = z.infer<typeof Z_ASSET_METADATA>;

export type AssetListEntry = {
  name: string;
  metadata: AssetMetadata;
};

export async function putAsset(
  name: string,
  metadata: AssetMetadata,
  data: ReadableStream
) {
  await env.kv.put(
    name,
    data as import("node:stream/web").ReadableStream, // workaround stream typing
    {
      metadata,
      // TODO: auto delete?
      // expirationTtl: 24 * 60 * 60,
    }
  );
}

export async function getAsset(key: string) {
  const { value, metadata } = await env.kv.getWithMetadata(key, "stream");
  tinyassert(value && metadata, "asset not found");
  return {
    value: value as ReadableStream, // workaround stream typing
    metadata: Z_ASSET_METADATA.parse(metadata),
  };
}

export async function listAssets({
  limit,
  cursor,
}: {
  limit: number;
  cursor?: string;
}): Promise<{ assets: AssetListEntry[]; nextCursor?: string }> {
  const result = await env.kv.list({ limit, cursor });
  const assets = result.keys.map((e) => {
    return {
      name: e.name,
      metadata: Z_ASSET_METADATA.parse(e.metadata),
    } satisfies AssetListEntry;
  });
  return {
    assets,
    nextCursor: result.list_complete ? undefined : result.cursor,
  };
}

export function createAssetKey(date: Date): string {
  // desc time
  const k1 = (Number.MAX_SAFE_INTEGER - date.getTime())
    .toString(16)
    .padStart(16, "0");

  // random for uniqueness
  const k2 = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
    .toString(16)
    .padStart(16, "0");

  return `${k1}-${k2}`;
}
