import { spawn } from "node:child_process";
import {
  GetObjectCommand,
  GetObjectCommandInput,
  ListObjectsV2CommandInput,
  S3,
} from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { typedBoolean } from "@hiogawa/utils";
import { z } from "zod";
import { serverConfig } from "./config";

// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/s3.html
// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/modules/_aws_sdk_s3_request_presigner.html
// https://github.com/aws/aws-sdk-js-v3/blob/864b34a52aea8dbd52a63239027b4c203c75863c/packages/s3-presigned-post/README.md

// TODO: object lifecycle to auto delete

let s3: S3;

export function initializeS3() {
  s3 = new S3({
    credentials: {
      accessKeyId: serverConfig.APP_S3_ACCESS_KEY_ID,
      secretAccessKey: serverConfig.APP_S3_SECRET_ACCESS_KEY,
    },
    endpoint: serverConfig.APP_S3_ENDPOINT,
    region: serverConfig.APP_S3_REGION,
    // this sneaky config is required for https://docs.localstack.cloud/user-guide/integrations/sdks/javascript/
    forcePathStyle: true,
  });
}

export async function s3ListObjects(
  options: Omit<ListObjectsV2CommandInput, "Bucket">
) {
  // https://docs.aws.amazon.com/AmazonS3/latest/userguide/ListingKeysUsingAPIs.html
  // > List results are always returned in UTF-8 binary order.
  const res = await s3.listObjectsV2({
    ...options,
    Bucket: serverConfig.APP_S3_BUCKET,
  });
  const objects = res.Contents ?? [];
  return objects;
}

export async function s3GetDownloadUrl(
  options: Omit<GetObjectCommandInput, "Bucket">
) {
  const command = new GetObjectCommand({
    ...options,
    Bucket: serverConfig.APP_S3_BUCKET,
  });
  const url = await getSignedUrl(s3, command, { expiresIn: 60 * 10 });
  return url;
}

export async function s3GetUploadPost(options: { Key: string }) {
  const res = await createPresignedPost(s3, {
    ...options,
    Bucket: serverConfig.APP_S3_BUCKET,
    Expires: 60 * 10,
  });
  return res;
}

export async function s3ResetBucket() {
  await spawnPromsie("pnpm s3-reset:test");
}

async function spawnPromsie(command: string) {
  // exec with inherit io
  const child = spawn(command, {
    stdio: "inherit",
    shell: true,
  });
  await new Promise<void>((resolve, reject) => {
    child.on("close", (code) => (code === 0 ? resolve() : reject()));
    child.on("error", reject);
  });
}

//
// s3 wrapper for our application needs
//
// we encode everything into object key for
// - timestamp based ordering for listObjects
// - metadata for videoId, title, etc... (without relying on "object tagging")
//

const Z_ASSET_CREATE = z.object({
  sortKey: z.string().regex(/^[0-9a-z]*$/),
  filename: z.string(),
  contentType: z.string(),
  // for app
  videoId: z.string(),
  title: z.string().optional(),
  artist: z.string().optional(),
});

type AssetCreate = z.infer<typeof Z_ASSET_CREATE>;

type Asset = { key: string } & AssetCreate;

function encodeString(s: string) {
  return Buffer.from(s, "ascii").toString("hex");
}

function decodeString(s: string) {
  return Buffer.from(s, "hex").toString("ascii");
}

function splitFirst(s: string, sep: string): [string, string] {
  const i = s.indexOf(sep);
  if (i === -1) {
    return [s, ""];
  }
  return [s.slice(0, i), s.slice(i + sep.length)];
}

function encodeAssetKey(asset: AssetCreate): string {
  // parse will move `sortKey` to front
  const { sortKey, ...rest } = Z_ASSET_CREATE.parse(asset);
  const restString = encodeString(JSON.stringify(rest));
  return sortKey + "-" + restString;
}

function decodeAssetKey(key: string): AssetCreate {
  const [sortKey, restString] = splitFirst(key, "-");
  const rest = JSON.parse(decodeString(restString));
  return Z_ASSET_CREATE.parse({ sortKey, ...rest });
}

export async function getAssetUploadPost(asset: AssetCreate) {
  const Key = encodeAssetKey(asset);
  return s3GetUploadPost({ Key });
}

export async function getAssetDownloadUrl(asset: Pick<Asset, "key">) {
  const { filename, contentType } = decodeAssetKey(asset.key);
  return s3GetDownloadUrl({
    Key: asset.key,
    ResponseContentType: contentType,
    ResponseContentDisposition: `attachment; filename="${filename}"`,
  });
}

export async function listAssets(
  cursor?: string
): Promise<{ assets: Asset[]; nextCursor?: string }> {
  const objects = await s3ListObjects({
    StartAfter: cursor,
    MaxKeys: 5,
  });
  const keys = objects.map((o) => o.Key).filter(typedBoolean); // TODO: when is `Key` undefined?
  const assets = keys.map((key) => ({ key, ...decodeAssetKey(key) }));
  return { assets, nextCursor: keys.at(-1) };
}
