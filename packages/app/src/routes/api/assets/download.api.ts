import { RequestContext } from "@hattip/compose";
import { tinyassert } from "@hiogawa/utils";
import { getAsset } from "../../../utils/asset-utils";

export async function get(ctx: RequestContext) {
  const name = ctx.url.searchParams.get("name");
  tinyassert(name);
  const { value, metadata } = await getAsset(name);
  return new Response(value, {
    // prettier-ignore
    headers: {
      "content-type": metadata.contentType,
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(metadata.filename)}`,
    },
  });
}
