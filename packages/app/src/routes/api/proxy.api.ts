import { RequestContext } from "@hattip/compose";
import { tinyassert } from "@hiogawa/utils";
import type { UseQueryOptions } from "@tanstack/react-query";
import { z } from "zod";

// simple proxy to fetch image data

const PROXY_REQUEST_SCHEMA = z.object({
  url: z.string(),
  headers: z.record(z.string(), z.string()).optional(),
});

export type ProxyRequest = z.infer<typeof PROXY_REQUEST_SCHEMA>;

export async function post(ctx: RequestContext) {
  const parsed = PROXY_REQUEST_SCHEMA.parse(
    JSON.parse(await ctx.request.text())
  );
  const { url, headers } = parsed;
  const res = await fetch(url, { headers });
  return new Response(res.body, { status: res.status });
}

//
// client
//

function fetchProxy(req: ProxyRequest): Promise<Response> {
  return fetch("/api/proxy", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export function fetchProxyQueryOptions(req: ProxyRequest) {
  return {
    queryKey: ["fetchProxy", req],
    queryFn: async () => {
      const res = await fetchProxy(req);
      tinyassert(res.ok);
      const buf = await res.arrayBuffer();
      return new Uint8Array(buf);
    },
  } satisfies UseQueryOptions;
}
