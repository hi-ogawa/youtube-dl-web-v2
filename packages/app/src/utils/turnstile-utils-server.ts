import { tinyassert } from "@hiogawa/utils";
import { z } from "zod";
import { serverConfig } from "./config";
import { decorateTraceAsync } from "./otel-utils";

// https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

export let verifyTurnstile = async (options: { response: string }) => {
  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: JSON.stringify({
        secret: serverConfig.APP_CAPTCHA_SECRET_KEY,
        response: options.response,
      }),
      headers: {
        "content-type": "application/json",
      },
    }
  );
  tinyassert(res.ok);
  const data = Z_SITE_VERIFY.parse(await res.json());
  tinyassert(data.success);
};

verifyTurnstile = decorateTraceAsync(
  () => ({ name: "verifyTurnstile" }),
  verifyTurnstile
);

const Z_SITE_VERIFY = z
  .object({
    success: z.boolean(),
  })
  .passthrough();
