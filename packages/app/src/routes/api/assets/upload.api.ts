import { RequestContext } from "@hattip/compose";
import { tinyassert } from "@hiogawa/utils";
import {
  Z_ASSET_METADATA,
  createAssetKey,
  putAsset,
} from "../../../utils/asset-utils";
import { parseFormData } from "../../../utils/form-data-utils";
import { json } from "../../../utils/handler-utils";
import { verifyTurnstile } from "../../../utils/turnstile-utils-server";

export async function post(ctx: RequestContext) {
  // validate FormData
  const formData = await ctx.request.formData();
  const { files, metadata } = parseFormData(formData);

  tinyassert(files.length === 1);
  const file = files[0];

  const parsed = Z_ASSET_METADATA.parse(metadata);

  // captcha
  await verifyTurnstile({ response: parsed.token });

  const key = createAssetKey(new Date());
  await putAsset(key, parsed, file.stream());

  return json({ ok: true });
}
