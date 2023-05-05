import { newPromiseWithResolvers, once, tinyassert } from "@hiogawa/utils";
import { useRefCallbackEffect, useStableCallback } from "@hiogawa/utils-react";
import { useMutation } from "@tanstack/react-query";
import React from "react";
import { z } from "zod";

// https://github.com/ytdl-org/youtube-dl/blob/9aa8e5340f3d5ece372b983f8e399277ca1f1fe4/youtube_dl/extractor/youtube.py#L1819-L1830
export interface FormatInfo {
  url: string;
  filesize?: number;
  format_id: string;
  format_note: string;
  ext: string;
  acodec: string; // none, opus, mp4a.40.2, ...
  vcodec: string; // none, vp9, av01.0.00M.08, ...
  width: number | null;
  height: number | null;
}

// https://github.com/ytdl-org/youtube-dl/blob/9aa8e5340f3d5ece372b983f8e399277ca1f1fe4/youtube_dl/extractor/youtube.py#L1958-L1986
export interface VideoInfo {
  id: string;
  title: string;
  shortDescription: string;
  uploader: string;
  artist?: string;
  album?: string;
  track?: string;
  formats: FormatInfo[];
}

export function parseVideoId(value: string): string | undefined {
  if (value.length === 11) {
    return value;
  }
  if (value.match(/youtube\.com|youtu\.be/)) {
    try {
      const url = new URL(value);
      if (url.hostname === "youtu.be") {
        return url.pathname.substring(1);
      } else {
        const videoId = url.searchParams.get("v");
        if (videoId) {
          return videoId;
        }
      }
    } catch {}
  }
  return;
}

const RAW_INFO_SCHEMA = z.object({
  videoDetails: z.object({
    videoId: z.string(),
    title: z.string(),
    author: z.string(),
    shortDescription: z.string(),
  }),
  streamingData: z.object({
    // formats: z.object({}).array(), // TODO
    adaptiveFormats: z
      .object({
        itag: z.number(),
        url: z.string(),
        mimeType: z.string(),
        width: z.number().optional(),
        height: z.number().optional(),
        // TODO: support undefined contentLength
        contentLength: z
          .string()
          .refine((s) => s.match(/^\d+$/))
          .transform(Number)
          .optional(),
      })
      .array(),
  }),
});

export async function fetchVideoInfo(videoId: string): Promise<VideoInfo> {
  const raw = await fetchVideoInfoRaw(videoId);
  const p = RAW_INFO_SCHEMA.parse(raw);
  return {
    id: p.videoDetails.videoId,
    title: p.videoDetails.title,
    uploader: p.videoDetails.author,
    shortDescription: p.videoDetails.shortDescription,
    formats: p.streamingData.adaptiveFormats.map((f) => ({
      url: f.url,
      filesize: f.contentLength,
      format_id: f.itag.toString(),
      format_note: f.mimeType,
      ext: f.mimeType.split(";")[0]!.split("/")[1]!,
      acodec: f.mimeType.includes("audio/")
        ? f.mimeType.split(";")[1]!
        : "none",
      vcodec: f.mimeType.includes("video/")
        ? f.mimeType.split(";")[1]!
        : "none",
      width: f.width ?? null,
      height: f.height ?? null,
    })),
  };
}

// cf. https://gist.github.com/hi-ogawa/23f6d0b212f51c2b1b255339c642e9b9
export async function fetchVideoInfoRaw(videoId: string): Promise<any> {
  // prettier-ignore
  const res = await fetch("https://www.youtube.com/youtubei/v1/player", {
    method: "POST",
    body: JSON.stringify({
      videoId,
      context: {
        client: {
          clientName: "ANDROID",
          clientVersion: "17.31.35",
          androidSdkVersion: 30,
          hl: "en",
          timeZone: "UTC",
          utcOffsetMinutes: 0,
        },
      },
    }),
    headers: {
      "X-YouTube-Client-Name": "3",
      "X-YouTube-Client-Version": "17.31.35",
      "Origin": "https://www.youtube.com",
      "User-Agent": "com.google.android.youtube/17.31.35 (Linux; U; Android 11) gzip",
      "content-type": "application/json",
    }
  });
  tinyassert(res.ok);
  tinyassert(res.headers.get("content-type")?.startsWith("application/json"));
  return JSON.parse(await res.text());
}

export function getThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

//
// iframe api
//

type YoutubeIframeApi = {
  ready: (callback: () => void) => void;
  Player: new (el: HTMLElement, options: YoutubePlayerOptions) => YoutubePlayer;
};

export interface YoutubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (second: number) => void;
  getCurrentTime: () => number;
  getPlayerState: () => number;
  destroy: () => void;
}

export const PLAYER_STATE_PLAYING = 1;

export type YoutubePlayerOptions = {
  videoId: string;
  height?: number;
  width?: number;
  playerVars?: {
    autoplay?: 0 | 1;
    start?: number; // must be integer
  };
  events?: {
    onReady?: () => void;
  };
};

// singleton
let youtubeIframeApi: YoutubeIframeApi;

const loadYoutubeIframeApi = once(async () => {
  tinyassert(typeof window !== "undefined");

  // load external <script>
  await loadScript("https://www.youtube.com/iframe_api");
  youtubeIframeApi = (window as any).YT as YoutubeIframeApi;
  tinyassert(youtubeIframeApi);

  // wait for api ready callback
  const { promise, resolve } = newPromiseWithResolvers<void>();
  youtubeIframeApi.ready(() => resolve());
  await promise;
});

async function loadYoutubePlayer(
  el: HTMLElement,
  options: YoutubePlayerOptions
): Promise<YoutubePlayer> {
  await loadYoutubeIframeApi();

  const { promise, resolve } = newPromiseWithResolvers<void>();
  const player = new youtubeIframeApi.Player(el, {
    ...options,
    events: { onReady: () => resolve() },
  });
  await promise;

  return player;
}

export function useYoutubePlayerLoader(
  playerOptions: YoutubePlayerOptions,
  { onReady }: { onReady: (player: YoutubePlayer) => void }
) {
  onReady = useStableCallback(onReady);

  const ref = useRefCallbackEffect<HTMLElement>((el) => {
    if (el && mutation.isIdle) {
      mutation.mutate(el);
    }
  });

  const mutation = useMutation(
    (el: HTMLElement) => loadYoutubePlayer(el, playerOptions),
    {
      onSuccess: onReady,
      onError: () => {
        window.alert("failed to initialize youtube player");
      },
    }
  );

  React.useEffect(() => {
    return () => mutation.data?.destroy();
  }, []);

  return { ref };
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.addEventListener("load", () => resolve());
    el.addEventListener("error", reject);
    document.body.appendChild(el);
  });
}
