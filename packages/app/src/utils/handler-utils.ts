import { tinyassert } from "@hiogawa/utils";

// cf.
// - https://github.com/hattipjs/hattip/blob/2f5b08335ad55b64a49db63b3d25781e9032e938/packages/base/response/src/index.ts
// - https://github.com/remix-run/remix/blob/5c868dceaa542d0ac61e742f62f7fc08d9f18de2/packages/remix-server-runtime/responses.ts

export function json(data: any, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function redirect(url: string, status: number = 302): Response {
  return new Response(null, {
    status,
    headers: {
      location: url,
    },
  });
}

//
// encode payload in URLSearchParams
//
const PAYLOAD_KEY = "payload";

export function encodePayload(value: unknown): URLSearchParams {
  return new URLSearchParams({ [PAYLOAD_KEY]: JSON.stringify(value) });
}

export function decodePayload(searchParams: URLSearchParams): unknown {
  const s = searchParams.get(PAYLOAD_KEY);
  tinyassert(s);
  return JSON.parse(s);
}

//
// headers
//

export const PRESET_HEADERS = {
  // fully cache on CDN (cf. https://vercel.com/docs/concepts/functions/serverless-functions/edge-caching)
  CACHE_CDN: {
    "cache-control": "public, max-age=0, s-max-age=31536000",
  },
};
