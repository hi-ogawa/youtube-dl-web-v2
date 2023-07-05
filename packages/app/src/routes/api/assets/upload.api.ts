import { RequestContext } from "@hattip/compose";
import { tinyassert } from "@hiogawa/utils";
import { decodeAssetUploadUrl, putAsset } from "../../../utils/asset-utils";
import { json } from "../../../utils/handler-utils";

export async function post(ctx: RequestContext) {
  // TODO: directly use FormData
  ctx.request.formData;

  const asset = decodeAssetUploadUrl(ctx.url);
  const data = ctx.request.body;
  tinyassert(data);
  await putAsset(asset, data);
  return json({ ok: true });
}
