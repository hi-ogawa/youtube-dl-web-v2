import type { RequestContext } from "rakkasjs";
import { z } from "zod";
import { tinyassert } from "../../utils/tinyassert";
import { fetchVideoInfo } from "../../utils/youtube-utils";

// proxy youtube's media data

const DOWNLOAD_REQUEST_SCHEME = z.object({
  id: z.string(),
  format_id: z.string(),
  start: z.number(),
  end: z.number(),
});

export type DownloadRequest = z.infer<typeof DOWNLOAD_REQUEST_SCHEME>;

export async function post(ctx: RequestContext) {
  const parsed = DOWNLOAD_REQUEST_SCHEME.parse(
    JSON.parse(await ctx.request.text())
  );
  const { id, format_id, start, end } = parsed;

  // refetch video info since format url is throttled based on request's IP address
  const videoInfo = await fetchVideoInfo(id);
  const format = videoInfo.formats.find((f) => f.format_id === format_id);
  tinyassert(format);

  tinyassert(start >= 0);
  tinyassert(end > 0);
  const res = await ctx.fetch(format.url, {
    headers: {
      range: `bytes=${start}-${end - 1}`,
    },
  });
  tinyassert(res.ok);

  const headers = new Headers();
  const contentType = res.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }
  return new Response(res.body, { headers });
}

//
// client
//

export function fetchDownload(req: DownloadRequest): Promise<Response> {
  return fetch("/api/download", {
    method: "POST",
    body: JSON.stringify(req),
  });
}
