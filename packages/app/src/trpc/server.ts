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
    .mutation(async ({ input }) => {
      const id = parseVideoId(input.id);
      tinyassert(id, "invalid video id");

      const videoInfo = await fetchVideoInfo(id);
      return { videoInfo };
    }),
});
