import { tinyassert } from "@hiogawa/utils";
import { z } from "zod";
import { serverConfig } from "./config";
import {
  patchPrototypeTraceAsync,
  patchProxyTraceAsync,
  patchTraceAsync,
  wrapTraceAsync,
} from "./otel-utils";

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

verifyTurnstile = wrapTraceAsync(verifyTurnstile, () => ({
  name: "verifyTurnstile",
}));

makePatchable(verifyTurnstile)

const Z_SITE_VERIFY = z
  .object({
    success: z.boolean(),
  })
  .passthrough();

export let turnstileServer: TurnstileServer;

export class TurnstileServer {
  static initialize() {
    turnstileServer = new TurnstileServer();
  }

  async verify(options: { response: string }) {
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
  }
}

patchTraceAsync(TurnstileServer.prototype, "verify", (..._args) => ({
  name: "TurnstileServer.verify",
}));

patchPrototypeTraceAsync(TurnstileServer, "verify");

patchProxyTraceAsync(TurnstileServer.prototype).verify((..._args) => ({
  name: "TurnstileServer.verify",
}));

type PatchProxyV2<T> = {
  [K in keyof T]: (patch: (original: T[K]) => T[K]) => void;
};

export function patchProxyV2<T>(patchee: T): PatchProxyV2<T> {
  return new Proxy(
    {},
    {
      get(_target, p, _receiver) {
        return (patch: any) => {
          (patchee as any)[p] = patch((patchee as any)[p]);
        };
      },
    }
  ) as any;
}

patchProxyV2(TurnstileServer.prototype).verify((original) =>
  wrapTraceAsync(original, () => ({
    name: "verifyTurnstile",
  }))
);

function makePatchable<T extends Function>(value: T): T & { __patch: T } {
  let current = value as any;

  return new Proxy(() => {}, {
    apply(_target, thisArg, argArray) {
      return current.apply(thisArg, argArray);
    },

    // get(target, p, receiver) {
    //   // @ts-expect-error
    //   Reflect.get(...arguments);
    // },

    set(_target, p, newValue, _receiver) {
      if (p === "__patch") {
        current = newValue;
        return true;
      }
      // @ts-expect-error
      return Reflect.set(...arguments);
    },
  }) as any;
}
