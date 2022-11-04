import { useMutation } from "@tanstack/react-query";
import { isNil, pick, sortBy } from "lodash";
import { navigate } from "rakkasjs";
import React from "react";
import { GitHub } from "react-feather";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { RadialProgress } from "../components/radial-progress";
import { VideoCard } from "../components/video-card";
import { DownloadProgress, download } from "../utils/download";
import { formatBytes } from "../utils/misc";
import { tinyassert } from "../utils/tinyassert";
import { useReadableStream } from "../utils/use-readable-stream";
import { webmToOpus } from "../utils/worker-client";
import { VideoInfo, getThumbnailUrl } from "../utils/youtube-utils";
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
    <div className="h-full flex flex-col items-center">
      <div className="w-xl max-w-full flex flex-col gap-4 p-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl">Youtube DL Web</h1>
          <a
            className="flex items-center"
            href="https://github.com/hi-ogawa/youtube-dl-web-v2"
            target="_blank"
          >
            <GitHub className="w-6 h-6" />
          </a>
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit((data) => {
            metadataQuery.mutate(data);
          })}
        >
          <div className="flex flex-col gap-2">
            <span>Video ID</span>
            <input
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
    </div>
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
    },
  });
  const { title, artist, album, embedThumbnail } = form.watch();

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

  const handleDownload = form.handleSubmit((data) => {
    tinyassert(data.format_id);
    setDownloadProgress(0);
    setDownloadStream(download(videoInfo, data.format_id));
  });

  useReadableStream({
    stream: downloadStream,
    onRead: (res) => {
      if (res.done) {
        return;
      }
      const { result, offset, total } = res.value;
      setDownloadProgress(offset / total);
      if (offset === total) {
        processFileMutation.mutate({
          audio: result,
          image: (embedThumbnail && thumbnailQuery.data) || undefined,
          title,
          artist,
          album,
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
      const output = await webmToOpus(arg.audio, metadata, arg.image);
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

  return (
    <form className="flex flex-col gap-4" onSubmit={handleDownload}>
      <VideoCard
        imageUrl={getThumbnailUrl(videoInfo.id)}
        title={videoInfo.title}
        uploader={videoInfo.uploader}
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
      {/* TODO: save history for quick input */}
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
}

function ignoreFormEnter(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === "Enter") {
    e.preventDefault();
    e.stopPropagation();
  }
}

function MainFormSkelton() {
  return (
    <>
      <VideoCard
        // taken from https://roadmaptoprofit.com/process-power-pack-for-businesses/video-placeholder/
        imageUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACoCAMAAABt9SM9AAAAG1BMVEXd3d3MzMzOzs7b29vU1NTY2NjS0tLW1tbf399oO5GCAAAE/ElEQVR4nO2dWYKDIBBEHRDk/iceURsVt24UFVPvc8YYKGgo1lQVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACScCs8naY30KrgqkEN3WI8zQrdP/wTVS9m97HqJzTsq0orTVPXVin1J6T9iK3rxujxZd+kzZoxXiKpQlu62boV7YuCtULVF6kUaVabjwWl03mUGrDmS3LVGZXqUObpLF5GzlpFNN+oXG6pVQ71PhGKzq5lzXuAzgR0Lmp4cpX+f70T84ZjszvVz+XxKpyZi2RtK5Cu5v78qP+fPDj42FY3O4hG2qmc2biJsR74Xv4yJ9mL1vq2sSDq0gPRNVT8VufwQ87pJhTH9a+/GcqJzVfsWn2jalHFytugmDu+5AaoSclrGu/5ltzoe8qcqlbGWM+Po3FObsdIrVbeb8mMvScTbdOobimUnFAUWsazp+aQ6YtK7g+NIAoba026XOTmUz//PDQs5GShy63ViWpR41iwWFTex1EYeoLUOAp1OO3jL4DfkkymcdLa6PIbLX6TNZ3zskljSHYlfikhthiPzuaomkqsl6R5fCWCDESzqUoci2F2Iymlb4BC4zjni6lncb9IIZ/anz7OGFVHrMzTC1cgNHn4xLQ+jKMeipH+FbH+lKyS8EvmlfSRoTgrCSTWfDFC0rXRG+rk5D5KmPjjPBuyOl8L4jf0jt9AvpEwBGEkf8yqM/PKxY3Fwr0DJZ9T1qFm+a1X88X+mue5JEXzQiSBMRHL9wyzWOSZrsKN1kwA2bNxLHIqFxmtk6l+iiH1HMO0FDaOxUO+IRbHJi7FcnpWudThEm2w8CdT/RCC1K+FbLAeFIv76KLFkqR+tX2LG/r9eP5xsRYN/f4ASBD17+MCsZama0etosWSdE/bNiNq6HdCEWJNX9RF4vY7IFb3TwOxpuyKNe0TdwwExHLV3G3t9Ic/L1bsHfaUKFqs89ZhOVuzx2+LFe0Ktwcv+oRYaQPp2GAdzjCXPdw5Nesgi0DPN2YdOItTsViiQWFP4WIlz5TKphsGyp78S52Dd9FEFnPFQrDw9kJSV3fkEdi9ofDVnYR1w1as+Sore8dD6euGKSvSkbXi79MK9fhEip9E0D+NG0MmMagku5cL3+sg2QW0totGuD2U4jYxsY/Db3eWYh0NbmIk44VXwt8UOxdLJeyTFOxveiWhgxLXLKa1mr6gbJsl2qsxE0u45a9/QdnOoZIcewhiqdTrLMrey+Zh92vj5Q9pRwZC+17uxSFhp+jxo0MlTL1TxpV/dofmpBSji6r7epF6KuymU6A5EZw3dLo5UyuoDhcbhdV9x4+oVIr179UkOjJbxbu+Jyuh3c19DLD8U78ecgRZzx+Fs3rlGgdPiI+8ZpEmdkqOwmo0ixkL3QX7X7B97xiteZPnhkw3WYwt9qxhgHLyp2x/I9tVL+5vaLPjELz0ilVFu/+V7e/6dcM1yWIcXS2iTRPf/ld4i+VZmzH+665H9LdMa7ol+QD/lL8ksWk2r0gsuysk1nK2pt8WvM9/IAg9mpndU9iP3EgdL5xmQD5n/2JM1sqlSh4/L3GVbvJUL2WbLHd6Pk53d/6VOtXmA3ZhC/pVhu3+nyFR5zqMqY5vGf4C/U92DDntbpjuftqj7rAT+r/Q736Mluy6S4dLhGdKAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAg4B88gCS4KbIjZAAAAABJRU5ErkJggg=="
        title={null}
        uploader={null}
        className="bg-gray-50"
      />
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
