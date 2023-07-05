import { RequestContext } from "@hattip/compose";
import {
  decodeAssetDownloadUrl,
  getAsset,
} from "../../../utils/asset-utils";

export async function post(ctx: RequestContext) {
  const asset = decodeAssetDownloadUrl(ctx.url);
  const data = await getAsset(asset);
  return new Response(data, {
    // prettier-ignore
    headers: {
      "content-type": asset.contentType,
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(asset.filename)}`,
    },
  });
}
