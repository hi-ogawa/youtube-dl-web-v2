import { MutationOptions, useMutation } from "@tanstack/react-query";
import type { RequestContext } from "rakkasjs";
import { z } from "zod";
import { json } from "../../utils/handler-utils";
import { tracePromise } from "../../utils/otel-utils";
import {
  VideoInfo,
  fetchVideoInfo,
  parseVideoId,
} from "../../utils/youtube-utils";

const METADATA_REQUEST_SCHEME = z.object({
  id: z.string(),
});

type MetadataRequest = z.infer<typeof METADATA_REQUEST_SCHEME>;

interface MetadataResponse {
  videoInfo: VideoInfo;
}

export async function post(ctx: RequestContext) {
  const parsed = METADATA_REQUEST_SCHEME.parse(
    JSON.parse(await ctx.request.text())
  );
  const id = parseVideoId(parsed.id);
  if (!id) {
    throw new Error("invalid id");
  }

  const videoInfo = await tracePromise(fetchVideoInfo(id), "fetchVideoInfo", {
    attributes: { "code.arguments": [id] },
  });
  const res: MetadataResponse = {
    videoInfo,
  };
  return json(res);
}

//
// client
//

async function fetchMetadata(req: MetadataRequest): Promise<MetadataResponse> {
  const res = await fetch("/api/metadata", {
    method: "POST",
    body: JSON.stringify(req),
  });
  return res.json();
}

export function useMetadata(options?: MutationOptions) {
  return useMutation(fetchMetadata, options as any);
}
