import { execSync } from "node:child_process";
import { GetObjectCommand, PutObjectCommand, S3 } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { serverConfig } from "./config";

// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/s3.html
// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/modules/_aws_sdk_s3_request_presigner.html

let s3: S3;
let bucketArg: { Bucket: string };

export function initializeS3() {
  s3 = new S3({
    credentials: {
      accessKeyId: serverConfig.APP_S3_ACCESS_KEY_ID,
      secretAccessKey: serverConfig.APP_S3_SECRET_ACCESS_KEY,
    },
    endpoint: serverConfig.APP_S3_ENDPOINT,
    region: serverConfig.APP_S3_REGION,
    // sneaky required config https://docs.localstack.cloud/user-guide/integrations/sdks/javascript/
    forcePathStyle: true,
  });

  bucketArg = { Bucket: serverConfig.APP_S3_BUCKET };
}

export async function s3ListKeys() {
  const res = await s3.listObjects(bucketArg);
  const objects = res.Contents ?? [];
  return objects;
}

export async function s3GetDownloadUrl(key: string) {
  const command = new GetObjectCommand({
    ...bucketArg,
    Key: key,
  });
  const url = await getSignedUrl(s3, command, { expiresIn: 60 * 10 });
  return url;
}

export async function s3GetUploadUrl(key: string) {
  const command = new PutObjectCommand({
    ...bucketArg,
    Key: key,
  });
  const url = await getSignedUrl(s3, command, { expiresIn: 60 * 10 });
  return url;
}

export async function s3ResetBucket() {
  execSync("pnpm -s s3-reset:test");
}
