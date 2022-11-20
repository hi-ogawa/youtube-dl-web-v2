import { Transition } from "@headlessui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { isNil, pick, sortBy, uniq } from "lodash";
import { navigate } from "rakkasjs";
import React from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { RadialProgress } from "../components/radial-progress";
import { PLACEHOLDER_IMAGE } from "../components/video-card";
import {
  DownloadProgress,
  download,
  downloadFastSeek,
} from "../utils/download";
import {
  cls,
  extractTimestamps,
  formatBytes,
  formatTimestamp,
  ignoreFormEnter,
  parseTimestamp,
} from "../utils/misc";
import { tinyassert } from "../utils/tinyassert";
import { useAnimationFrameLoop } from "../utils/use-animation-frame-loop";
import { useReadableStream } from "../utils/use-readable-stream";
import { useStableRef } from "../utils/use-stable-ref";
import { webmToOpus } from "../utils/worker-client";
import {
  PLAYER_STATE_PLAYING,
  VideoInfo,
  YoutubePlayer,
  getThumbnailUrl,
  loadYoutubeIframeApi,
} from "../utils/youtube-utils";
import { useMetadata } from "./api/metadata.api";
import { useFetchProxy } from "./api/proxy.api";
import { SHARE_TARGET_PARAMS } from "./manifest.json.api";

export default function Page() {
  const form = useForm({
    defaultValues: {
      id: "",
    },
  });

  const metadataQuery = useMetadata({
    onError: () => {
      toast.error("failed to fetch video info", {
        id: "metadataQuery.onError",
      });
    },
  });

  // handle share
  React.useEffect(() => {
    if (window.location.href) {
      const url = new URL(window.location.href);
      const id = url.searchParams.get(SHARE_TARGET_PARAMS.text);
      if (id) {
        form.setValue("id", id);
        metadataQuery.mutate(
          { id },
          {
            onSettled: () => {
              navigate("/", { replace: true });
            },
          }
        );
      }
    }
  }, []);

  return (
    <main className="flex flex-col items-center">
      <div className="w-xl max-w-full flex flex-col gap-4 p-4">
        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit((data) => {
            metadataQuery.mutate(data);
          })}
        >
          <div className="flex flex-col gap-2">
            <span>Video ID</span>
            <input
              data-lpignore="true" // https://stackoverflow.com/a/44984917
              className="input px-1"
              placeholder="ID or URL"
              {...form.register("id")}
              aria-invalid={metadataQuery.isError}
            />
          </div>
          <button
            className="p-1 btn btn-default"
            disabled={metadataQuery.isLoading}
          >
            <div className="flex justify-center items-center relative">
              <span>Search</span>
              {metadataQuery.isLoading && (
                <div className="absolute right-4 w-4 h-4 spinner"></div>
              )}
            </div>
          </button>
        </form>
        <div className="border-t m-1"></div>
        {!metadataQuery.isSuccess && <MainFormSkelton />}
        {metadataQuery.isSuccess && (
          <MainForm videoInfo={metadataQuery.data.videoInfo} />
        )}
      </div>
    </main>
  );
}

//
// MainForm
//

function MainForm({ videoInfo }: { videoInfo: VideoInfo }) {
  // filter only webm audio
  const formats = sortBy(
    videoInfo.formats.filter(
      (f) => f.acodec !== "none" && f.ext === "webm" && f.filesize
    ),
    (f) => f.filesize
  ).reverse();

  React.useEffect(() => {
    if (formats.length === 0) {
      // haven't seen such case but it might be possible
      toast.error("unsupported video (valid audio format is not found)");
    }
  }, [formats]);

  const form = useForm({
    defaultValues: {
      format_id: formats[0]?.format_id,
      title: videoInfo.title,
      artist: videoInfo.artist ?? videoInfo.uploader,
      album: videoInfo.album,
      embedThumbnail: true,
      startTime: undefined as undefined | string,
      endTime: undefined as undefined | string,
    },
  });
  const { title, artist, album, embedThumbnail, startTime, endTime } =
    form.watch();

  const [downloadStream, setDownloadStream] =
    React.useState<ReadableStream<DownloadProgress>>();

  const [downloadProgress, setDownloadProgress] = React.useState<number>();

  const thumbnailQuery = useFetchProxy(
    { url: getThumbnailUrl(videoInfo.id) },
    {
      onError: () => {
        toast.error("failed to fetch thumbnail data");
      },
    }
  );

  // TODO: disable form during download
  const handleDownload = form.handleSubmit((data) => {
    tinyassert(data.format_id);
    setDownloadProgress(0);
    if (startTime || endTime) {
      setDownloadStream(
        downloadFastSeek(
          videoInfo,
          data.format_id,
          startTime ? parseTimestamp(startTime) : undefined,
          endTime ? parseTimestamp(endTime) : undefined
        )
      );
    } else {
      setDownloadStream(download(videoInfo, data.format_id));
    }
  });

  useReadableStream({
    stream: downloadStream,
    onRead: (res) => {
      if (res.done) {
        return;
      }
      const { result, offset, total } = res.value;
      setDownloadProgress(offset / total);
      if (result) {
        processFileMutation.mutate({
          audio: result,
          image: (embedThumbnail && thumbnailQuery.data) || undefined,
          title: title?.trim(),
          artist: artist?.trim(),
          album: album?.trim(),
          startTime: startTime?.trim(),
          endTime: endTime?.trim(),
        });
      }
    },
    onError: () => {
      toast.error("failed to download", { id: "useReadableStream.onError" });
    },
  });

  const processFileMutation = useMutation(
    async (arg: ProcessFileArg) => {
      const metadata = pick(arg, ["title", "artist", "album"]);
      const output = await webmToOpus(
        arg.audio,
        metadata,
        arg.startTime,
        arg.endTime,
        arg.image
      );
      const url = URL.createObjectURL(new Blob([output]));
      const name =
        ([arg.artist, arg.album, arg.title].filter(Boolean).join(" - ") ||
          "download") + ".opus";
      return { url, name };
    },
    {
      onSuccess: () => {
        toast.success("successfully downloaded");
      },
      onError: () => {
        toast.error("failed to create an opus file", {
          id: "processFileMutation.onError",
        });
      },
    }
  );

  const [player, setPlayer] = React.useState<YoutubePlayer>();

  const timestampOptions = uniq(extractTimestamps(videoInfo.shortDescription));

  return (
    <form className="flex flex-col gap-4" onSubmit={handleDownload}>
      <VideoPlayer
        videoId={videoInfo.id}
        player={player}
        setPlayer={setPlayer}
      />
      <div className="flex flex-col gap-2">
        <span>Audio</span>
        <select className="input px-1" {...form.register("format_id")}>
          {formats.map(
            (f) =>
              f.filesize && (
                <option key={f.format_id} value={f.format_id}>
                  {formatBytes(f.filesize)}
                </option>
              )
          )}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <span>Title</span>
        <input
          className="input px-1"
          {...form.register("title")}
          onKeyDown={ignoreFormEnter}
        />
      </div>
      <div className="flex flex-col gap-2">
        <span>Artist</span>
        <input
          className="input px-1"
          {...form.register("artist")}
          onKeyDown={ignoreFormEnter}
        />
      </div>
      <div className="flex flex-col gap-2">
        <span>Album</span>
        <input
          className="input px-1"
          {...form.register("album")}
          onKeyDown={ignoreFormEnter}
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-[75px]">Start Time</span>
          <button
            className="p-0.5 btn btn-default flex items-center"
            type="button"
            disabled={!player}
            onClick={() => {
              if (player) {
                form.setValue(
                  "startTime",
                  formatTimestamp(player.getCurrentTime())
                );
              }
            }}
            title="set current player time"
          >
            <span className="i-ri-time-line w-4 h-4"></span>
          </button>
          <button
            className="p-0.5 btn btn-default flex items-center"
            type="button"
            disabled={!player}
            onClick={() => {
              if (player && startTime) {
                player.seekTo(parseTimestamp(startTime));
              }
            }}
            title="seek player"
          >
            <span className="i-ri-play-line w-4 h-4"></span>
          </button>
        </div>
        <input
          className="input px-1"
          list="timestamp-options"
          placeholder="hh:mm:ss"
          {...form.register("startTime")}
          onKeyDown={ignoreFormEnter}
        />
        <datalist id="timestamp-options">
          {timestampOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </datalist>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-[75px]">End Time</span>
          <button
            className="p-0.5 btn btn-default flex items-center"
            type="button"
            disabled={!player}
            onClick={() => {
              if (player) {
                form.setValue(
                  "endTime",
                  formatTimestamp(player.getCurrentTime())
                );
              }
            }}
            title="set current player time"
          >
            <span className="i-ri-time-line w-4 h-4"></span>
          </button>
          <button
            className="p-0.5 btn btn-default flex items-center"
            type="button"
            disabled={!player}
            onClick={() => {
              if (player && endTime) {
                player.seekTo(parseTimestamp(endTime));
              }
            }}
            title="seek player"
          >
            <span className="i-ri-play-line w-4 h-4"></span>
          </button>
        </div>
        <input
          className="input px-1"
          list="timestamp-options"
          placeholder="hh:mm:ss"
          {...form.register("endTime")}
          onKeyDown={ignoreFormEnter}
        />
        {timestampOptions.length > 0}
      </div>
      <div className="flex gap-4">
        <span>Embed Thumbnail</span>
        <input
          type="checkbox"
          {...form.register("embedThumbnail")}
          disabled={!thumbnailQuery.isSuccess}
        />
      </div>
      {!processFileMutation.isSuccess && (
        <button
          className="p-1 btn btn-primary"
          disabled={processFileMutation.isLoading || !isNil(downloadProgress)}
        >
          <div className="flex justify-center items-center relative">
            {!processFileMutation.isLoading && isNil(downloadProgress) && (
              <span>Download</span>
            )}
            {!processFileMutation.isLoading && !isNil(downloadProgress) && (
              <span>Downloading...</span>
            )}
            {processFileMutation.isLoading && <span>Processing...</span>}
            {!isNil(downloadProgress) && (
              <RadialProgress
                progress={downloadProgress}
                className="absolute right-2 w-6 h-6 text-gray-500"
                classNameBackCircle="text-gray-50"
              />
            )}
          </div>
        </button>
      )}
      {processFileMutation.isSuccess && (
        <a
          className="p-1 btn btn-primary"
          href={processFileMutation.data.url}
          download={processFileMutation.data.name}
        >
          <div className="flex justify-center items-center">
            <span>Finished!</span>
          </div>
        </a>
      )}
    </form>
  );
}

interface ProcessFileArg {
  audio: Uint8Array;
  image?: Uint8Array;
  title?: string;
  artist?: string;
  album?: string;
  startTime?: string;
  endTime?: string;
}

function MainFormSkelton() {
  return (
    <>
      <VideoPlayerSkelton />
      <div className="flex flex-col gap-2">
        <span>Audio</span>
        <select className="input px-1" disabled></select>
      </div>
      <div className="flex flex-col gap-2">
        <span>Title</span>
        <input className="input px-1" disabled />
      </div>
      <div className="flex flex-col gap-2">
        <span>Artist</span>
        <input className="input px-1" disabled />
      </div>
      <div className="flex flex-col gap-2">
        <span>Album</span>
        <input className="input px-1" disabled />
      </div>
      <div className="flex flex-col gap-2">
        <span>Start Time</span>
        <input className="input px-1" placeholder="hh:mm:ss" disabled />
      </div>
      <div className="flex flex-col gap-2">
        <span>End Time</span>
        <input className="input px-1" placeholder="hh:mm:ss" disabled />
      </div>
      <div className="flex gap-4">
        <span>Embed Thumbnail</span>
        <input type="checkbox" disabled />
      </div>
      <button className="p-1 btn btn-primary" disabled>
        Download
      </button>
    </>
  );
}

function VideoPlayer({
  videoId,
  player,
  setPlayer,
}: {
  videoId: string;
  player?: YoutubePlayer;
  setPlayer: (player?: YoutubePlayer) => void;
}) {
  const ref = usePlayer({ videoId, setPlayer });

  const [isPlaying, setIsPlaying] = React.useState(false);

  useAnimationFrameLoop(() => {
    setIsPlaying(player?.getPlayerState() === PLAYER_STATE_PLAYING);
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-full aspect-video overflow-hidden">
        <div ref={ref} className="absolute w-full h-full" />
        <Transition
          show={!player}
          appear={true}
          className="absolute inset-0 flex justify-center items-center transition duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="absolute inset-0 bg-base opacity-50"></div>
          <span className="absolute spinner w-20 h-20 !border-4"></span>
        </Transition>
      </div>
      <div className="flex gap-1.5">
        <button
          type="button"
          className="flex-1 p-1 btn btn-default flex justify-center"
          disabled={!player}
          onClick={() => {
            if (player) {
              player.seekTo(player.getCurrentTime() - 5);
            }
          }}
        >
          <span className="i-ri-skip-back-line w-5 h-5"></span>
        </button>
        <button
          type="button"
          className="flex-1 p-1 btn btn-default flex justify-center"
          disabled={!player}
          onClick={() => {
            if (isPlaying) {
              player?.pauseVideo();
            } else {
              player?.playVideo();
            }
          }}
        >
          <span
            className={cls(
              isPlaying ? "i-ri-pause-line" : "i-ri-play-line",
              "w-5 h-5"
            )}
          ></span>
        </button>
        <button
          type="button"
          className="flex-1 p-1 btn btn-default flex justify-center"
          disabled={!player}
          onClick={() => {
            if (player) {
              player.seekTo(player.getCurrentTime() + 5);
            }
          }}
        >
          <span className="i-ri-skip-forward-line w-5 h-5"></span>
        </button>
      </div>
    </div>
  );
}

function VideoPlayerSkelton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-full aspect-video overflow-hidden dark:(filter brightness-50)">
        <img src={PLACEHOLDER_IMAGE} className="absolute w-full h-full" />
      </div>
      <div className="flex gap-1.5">
        <button
          type="button"
          className="flex-1 p-1 btn btn-default flex justify-center"
          disabled
        >
          <span className="i-ri-skip-back-line w-5 h-5"></span>
        </button>
        <button
          type="button"
          className="flex-1 p-1 btn btn-default flex justify-center"
          disabled
        >
          <span className="i-ri-play-line w-5 h-5"></span>
        </button>
        <button
          type="button"
          className="flex-1 p-1 btn btn-default flex justify-center"
          disabled
        >
          <span className="i-ri-skip-forward-line w-5 h-5"></span>
        </button>
      </div>
    </div>
  );
}

// TODO: not hmr friendly
function usePlayer(args: {
  videoId: string;
  setPlayer: (player?: YoutubePlayer) => void;
}) {
  const apiQuery = useYoutubeIframeApi();
  const setPlayerRef = useStableRef(args.setPlayer);

  return React.useCallback(
    (el: HTMLDivElement | null) => {
      if (!apiQuery.isSuccess) {
        setPlayerRef.current(undefined);
        return;
      }

      if (el) {
        const api = apiQuery.data;
        const player = new api.Player(el, {
          videoId: args.videoId,
          events: {
            onReady: () => {
              setPlayerRef.current(player);
            },
          },
        });
      } else {
        setPlayerRef.current(undefined);
      }
    },
    [apiQuery.isSuccess, args.videoId]
  );
}

function useYoutubeIframeApi() {
  return useQuery({
    queryKey: [useYoutubeIframeApi.name],
    queryFn: loadYoutubeIframeApi,
    staleTime: Infinity,
    cacheTime: Infinity,
    onError: () => {
      toast.error("failed to load youtube iframe");
    },
  });
}
