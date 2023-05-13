import { tinyassert } from "@hiogawa/utils";
import { z } from "zod";
import { fetchVideoInfo, parseVideoId } from "../utils/youtube-utils";
import { trpcProcedureBuilder, trpcRouterFactory } from "./factory";

export const trpcRoot = trpcRouterFactory({
  getVideoMetadata: trpcProcedureBuilder
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ input }) => {
      const id = parseVideoId(input.id);
      tinyassert(id, "invalid video id");

      const videoInfo = fetchVideoInfo(id);
      return { videoInfo };
    }),
});
