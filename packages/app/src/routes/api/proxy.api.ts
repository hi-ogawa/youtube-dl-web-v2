import { UseQueryOptions, useQuery } from "@tanstack/react-query";
import type { RequestContext } from "rakkasjs";
import { z } from "zod";
import { tinyassert } from "../../utils/tinyassert";

// simple proxy to fetch image data

const PROXY_REQUEST_SCHEMA = z.object({
  url: z.string(),
  headers: z.record(z.string(), z.string()).optional(),
});

type ProxyRequest = z.infer<typeof PROXY_REQUEST_SCHEMA>;

export async function post(ctx: RequestContext) {
  const parsed = PROXY_REQUEST_SCHEMA.parse(
    JSON.parse(await ctx.request.text())
  );
  const { url, headers } = parsed;
  const res = await ctx.fetch(url, { headers });
  return new Response(res.body, { status: res.status });
}

//
// client
//

export function fetchProxy(req: ProxyRequest): Promise<Response> {
  return fetch("/api/proxy", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export function useFetchProxy(
  req: ProxyRequest,
  options?: UseQueryOptions<Uint8Array>
) {
  return useQuery({
    queryKey: [useFetchProxy.name, req],
    queryFn: async () => {
      const res = await fetchProxy(req);
      tinyassert(res.ok);
      const buf = await res.arrayBuffer();
      return new Uint8Array(buf);
    },
    ...options,
  });
}
