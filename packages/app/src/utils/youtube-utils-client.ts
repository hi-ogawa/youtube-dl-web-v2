import { newPromiseWithResolvers, once, tinyassert } from "@hiogawa/utils";
import { useRefCallbackEffect, useStableCallback } from "@hiogawa/utils-react";
import { useMutation } from "@tanstack/react-query";
import React from "react";

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
      // https://github.com/TanStack/query/issues/4983
      window.setTimeout(() => mutation.mutate(el));
    }
  });

  const mutation = useMutation(
    (el: HTMLElement) => loadYoutubePlayer(el, playerOptions),
    {
      onSuccess: (player) => {
        onReady(player);
      },
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
