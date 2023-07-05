import { RequestContext } from "@hattip/compose";
import { decodeAssetDownloadUrl, getAsset } from "../../../utils/asset-utils";

export async function get(ctx: RequestContext) {
  const asset = decodeAssetDownloadUrl(ctx.url);
  const data = await getAsset(asset);
  return new Response(data, {
    // prettier-ignore
    headers: {
      "content-type": "audio/opus",
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent("test.opus")}`,
    },
  });
}
