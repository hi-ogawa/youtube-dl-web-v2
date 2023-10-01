import { Transition } from "@headlessui/react";
import { tinyassert } from "@hiogawa/utils";
import { useRafLoop } from "@hiogawa/utils-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { pick, sortBy, uniqBy } from "lodash";
import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Popover } from "../components/popover";
import { rpcClientQuery } from "../trpc/client";
import { AssetMetadata } from "../utils/asset-utils";
import { triggerDownloadClick } from "../utils/browser-utils";
import {
  DownloadProgress,
  download,
  downloadFastSeek,
} from "../utils/download";
import { createFormData } from "../utils/form-data-utils";
import {
  TimestampEntry,
  cls,
  extractTimestamps,
  formatBytes,
  formatTimestamp,
  ignoreFormEnter,
  parseTimestamp,
} from "../utils/misc";
import { toast } from "../utils/toast";
import { useReadableStream } from "../utils/use-readable-stream";
import { webmToOpus } from "../utils/worker-client";
import { VideoInfo, getThumbnailUrl } from "../utils/youtube-utils";
import {
  PLAYER_STATE_PLAYING,
  YoutubePlayer,
  useYoutubePlayerLoader,
} from "../utils/youtube-utils-client";
import { fetchProxyQueryOptions } from "./api/proxy.api";
import { SHARE_TARGET_PARAMS } from "./manifest.json.api";

export function Component() {
  const form = useForm({
    defaultValues: {
      id: "",
    },
  });

  const metadataQuery = useMutation({
    ...rpcClientQuery.getVideoMetadata.mutationOptions(),
    onError: () => {
      toast.error("Failed to fetch video info");
    },
  });

  // handle share
  const navigate = useNavigate();
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
              className="antd-input px-2"
              placeholder="ID or URL"
              {...form.register("id")}
              aria-invalid={metadataQuery.isError}
            />
          </div>
          <button
            className="p-1 antd-btn antd-btn-default"
            disabled={metadataQuery.isLoading}
          >
            <div className="flex justify-center items-center relative">
              <span>Search</span>
              {metadataQuery.isLoading && (
                <div className="absolute right-4 w-4 h-4 antd-spin"></div>
              )}
            </div>
          </button>
        </form>
        {metadataQuery.isSuccess && (
          <>
            <div className="border-t m-1"></div>
            <MainForm videoInfo={metadataQuery.data.videoInfo} />
          </>
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
      toast.error("Unsupported video (valid audio format is not found)");
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

  const [downloadProgress, setDownloadProgress] = React.useState<number>(0);

  const isDownloadStarted = Boolean(downloadStream);

  const thumbnailQuery = useQuery({
    ...fetchProxyQueryOptions({ url: getThumbnailUrl(videoInfo.id) }),
    onError: () => {
      toast.error("Failed to fetch thumbnail data");
    },
  });

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
      toast.error("Failed to download");
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
      const filename =
        ([arg.artist, arg.album, arg.title].filter(Boolean).join(" - ") ||
          "download") + ".opus";
      return { filename, output };
    },
    {
      onSuccess: ({ filename, output }) => {
        toast.success("Successfully downloaded");
        const href = URL.createObjectURL(new Blob([output])); // TODO: URL.revokeObjectURL
        triggerDownloadClick({ href, download: filename });
      },
      onError: () => {
        toast.error("Failed to create an opus file");
      },
    }
  );

  const uploadShareMutation = useMutation({
    mutationFn: async (args: { output: Uint8Array; filename: string }) => {
      const url = "/api/assets/upload";
      const formData = createFormData({
        files: [new File([args.output], "__dummy")],
        metadata: {
          filename: args.filename,
          contentType: "audio/opus",
          videoId: videoInfo.id,
          title,
          artist,
        } satisfies AssetMetadata,
      });
      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });
      tinyassert(res.ok);
    },
    onSuccess: () => {
      toast.success("Successfully uploaded");
    },
  });

  const [player, setPlayer] = React.useState<YoutubePlayer>();

  const timestampOptions = uniqBy(
    extractTimestamps(videoInfo.shortDescription),
    (t) => t.time
  );

  return (
    <form className="flex flex-col gap-4" onSubmit={handleDownload}>
      <VideoPlayer
        videoId={videoInfo.id}
        player={player}
        setPlayer={setPlayer}
        timestampOptions={timestampOptions}
        setStartTime={(t) => {
          form.setValue("startTime", t);
        }}
        setEndTime={(t) => {
          form.setValue("endTime", t);
        }}
      />
      <div className="flex flex-col gap-2">
        <span>Audio</span>
        <select
          className="antd-input px-1"
          {...form.register("format_id")}
          disabled={isDownloadStarted}
        >
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
          className="antd-input px-1"
          {...form.register("title")}
          onKeyDown={ignoreFormEnter}
          readOnly={isDownloadStarted}
        />
      </div>
      <div className="flex flex-col gap-2">
        <span>Artist</span>
        <input
          className="antd-input px-1"
          {...form.register("artist")}
          onKeyDown={ignoreFormEnter}
          readOnly={isDownloadStarted}
        />
      </div>
      <div className="flex flex-col gap-2">
        <span>Album</span>
        <input
          className="antd-input px-1"
          {...form.register("album")}
          onKeyDown={ignoreFormEnter}
          readOnly={isDownloadStarted}
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-[75px]">Start Time</span>
          <button
            className="p-0.5 antd-btn antd-btn-default flex items-center"
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
            className="p-0.5 antd-btn antd-btn-default flex items-center"
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
          className="antd-input px-1"
          placeholder="hh:mm:ss"
          {...form.register("startTime")}
          onKeyDown={ignoreFormEnter}
          readOnly={isDownloadStarted}
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-[75px]">End Time</span>
          <button
            className="p-0.5 antd-btn antd-btn-default flex items-center"
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
            className="p-0.5 atnd-btn antd-btn-default flex items-center"
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
          className="antd-input px-1"
          placeholder="hh:mm:ss"
          {...form.register("endTime")}
          onKeyDown={ignoreFormEnter}
          readOnly={isDownloadStarted}
        />
      </div>
      <div className="flex gap-4">
        <span>Embed Thumbnail</span>
        <input
          type="checkbox"
          {...form.register("embedThumbnail")}
          readOnly={!thumbnailQuery.isSuccess || isDownloadStarted}
        />
      </div>
      <button
        type="submit"
        className="p-1 antd-btn antd-btn-primary"
        disabled={Boolean(downloadStream)}
      >
        <div className="flex justify-center items-center relative">
          {!downloadStream && <span>Download</span>}
          {downloadStream && processFileMutation.isIdle && (
            <>
              <span>Downloading...</span>
              <span className="absolute right-2 text-sm">
                ({(downloadProgress * 100).toPrecision(3) + "%"})
              </span>
            </>
          )}
          {processFileMutation.isLoading && <span>Processing...</span>}
          {processFileMutation.isSuccess && <span>Finished!</span>}
        </div>
      </button>
      <button
        type="button"
        className={cls(
          "p-1 antd-btn antd-btn-default",
          uploadShareMutation.isLoading && "antd-btn-loading"
        )}
        disabled={
          !processFileMutation.isSuccess || uploadShareMutation.isSuccess
        }
        onClick={() => {
          processFileMutation.isSuccess &&
            uploadShareMutation.mutate({
              output: processFileMutation.data.output,
              filename: processFileMutation.data.filename,
            });
        }}
      >
        <div className="flex justify-center items-center relative">
          Upload to share
        </div>
      </button>
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

function VideoPlayer({
  videoId,
  player,
  setPlayer,
  timestampOptions,
  setStartTime,
  setEndTime,
}: {
  videoId: string;
  player?: YoutubePlayer;
  setPlayer: (player?: YoutubePlayer) => void;
  timestampOptions: TimestampEntry[];
  setStartTime: (t: string) => void;
  setEndTime: (t: string) => void;
}) {
  const { ref } = useYoutubePlayerLoader({ videoId }, { onReady: setPlayer });

  const [isPlaying, setIsPlaying] = React.useState(false);

  useRafLoop(() => {
    setIsPlaying(player?.getPlayerState() === PLAYER_STATE_PLAYING);
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-full aspect-video overflow-hidden">
        <div ref={ref} className="absolute w-full h-full" />
        <Transition
          show={!player}
          className="absolute inset-0 flex justify-center items-center transition duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="absolute inset-0 bg-body opacity-50"></div>
          <span className="absolute antd-spin w-20 h-20 !border-4"></span>
        </Transition>
      </div>
      <div className="flex gap-1.5">
        <button
          type="button"
          className="flex-1 p-1 antd-btn antd-btn-default flex justify-center"
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
          className="flex-1 p-1 antd-btn antd-btn-default flex justify-center"
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
          className="flex-1 p-1 antd-btn antd-btn-default flex justify-center"
          disabled={!player}
          onClick={() => {
            if (player) {
              player.seekTo(player.getCurrentTime() + 5);
            }
          }}
        >
          <span className="i-ri-skip-forward-line w-5 h-5"></span>
        </button>
        {timestampOptions.length > 0 && (
          <Popover
            placement="left"
            reference={({ props, open, setOpen }) => (
              <button
                type="button"
                className="flex-none p-1 antd-btn antd-btn-default flex justify-center items-center"
                onClick={() => {
                  setOpen(!open);
                }}
                {...props}
              >
                <span className="i-ri-play-list-2-line w-5 h-4"></span>
              </button>
            )}
            floating={({ props, open }) => (
              <Transition
                show={open}
                unmount={false} // for floating-ui positioning. also for preserving scroll position
                className="transition duration-150"
                enterFrom="scale-80 opacity-0"
                enterTo="scale-100 opacity-100"
                leaveFrom="scale-100 opacity-100"
                leaveTo="scale-80 opacity-0"
                {...props}
              >
                <div className="antd-floating max-w-[250px] max-h-[400px] overflow-y-auto">
                  <ul className="flex flex-col">
                    {timestampOptions.map((t) => (
                      <li
                        key={t.time}
                        className="flex flex-col gap-1.5 p-1.5 border-b last:border-none text-sm"
                      >
                        <span>{t.label}</span>
                        <div className="flex items-center text-sm gap-2">
                          <span>{t.time}</span>
                          <span className="flex-1"></span>
                          <button
                            className="antd-btn antd-btn-default h-5 flex items-center"
                            type="button"
                            disabled={!player}
                            onClick={() => {
                              if (player) {
                                player.seekTo(parseTimestamp(t.time));
                              }
                            }}
                          >
                            <span className="i-ri-play-line w-5 h-5"></span>
                          </button>
                          <button
                            className="px-1 antd-btn antd-btn-default text-sm h-5 flex items-center"
                            type="button"
                            onClick={() => {
                              setStartTime(t.time);
                            }}
                          >
                            start
                          </button>
                          <button
                            className="px-1 antd-btn antd-btn-default text-sm h-5 flex items-center"
                            type="button"
                            onClick={() => {
                              setEndTime(t.time);
                            }}
                          >
                            end
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </Transition>
            )}
          />
        )}
      </div>
    </div>
  );
}
