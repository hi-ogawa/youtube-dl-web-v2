import { tinyassert } from "@hiogawa/utils";
import { useMutation } from "@tanstack/react-query";
import React from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { PLACEHOLDER_IMAGE } from "../components/video-card";
import { ignoreFormEnter } from "../utils/misc";
import {
  extractCoverArt,
  extractMetadata,
  webmToOpus,
} from "../utils/worker-client";

interface FormType {
  fileList?: FileList;
  title?: string;
  artist?: string;
  album?: string;
  startTime?: string;
  endTime?: string;
}

export function Component() {
  const form = useForm<FormType>();
  const { fileList, title, artist, album, startTime, endTime } = form.watch();
  const [jpeg, setJpeg] = React.useState<Uint8Array>();

  //
  // initialize form by reading metadata
  //
  const file = fileList?.[0];

  React.useEffect(() => {
    if (file) {
      probeMutation.mutate(file);
    }
  }, [file]);

  const probeMutation = useMutation(
    async (file: File) => {
      const data = new Uint8Array(await file.arrayBuffer());
      const jpeg = await extractCoverArt(data);
      const thumbnailUrl = URL.createObjectURL(new Blob([jpeg]));
      const metadata = await extractMetadata(data);
      return { jpeg, thumbnailUrl, metadata };
    },
    {
      onSuccess: (data) => {
        setJpeg(data.jpeg);
        for (const key of ["title", "artist", "album"] as const) {
          form.setValue(key, data.metadata[key]);
        }
      },
      onError: () => {
        form.setValue("fileList", undefined);
        toast.error("failed to read file", {
          id: "probeMutation.onError",
        });
      },
    }
  );

  //
  // convert file
  //
  const processFileMutation = useMutation(
    async () => {
      tinyassert(file);
      const webm = new Uint8Array(await file.arrayBuffer());
      const output = await webmToOpus(
        webm,
        { title, artist, album },
        startTime,
        endTime,
        jpeg
      );
      const url = URL.createObjectURL(new Blob([output]));
      const name =
        ([artist, album, title].filter(Boolean).join(" - ") || "download") +
        ".opus";
      return { url, name };
    },
    {
      onSuccess: () => {
        toast.success("successfully converted");
      },
      onError: () => {
        toast.error("failed to convert", {
          id: "convertMutation.onError",
        });
      },
    }
  );

  return (
    <main className="flex flex-col items-center">
      <div className="w-xl max-w-full flex flex-col gap-4 p-4">
        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(() => {
            processFileMutation.mutate();
          })}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span>
                Input File{" "}
                <span className="text-sm text-base-content-secondary">
                  (.opus)
                </span>
              </span>
              {probeMutation.isLoading && (
                <div className="antd-spin w-4 h-4"></div>
              )}
            </div>
            <input type="file" {...form.register("fileList")} />
          </div>
          <div className="border-t m-1"></div>
          <div className="flex flex-col gap-2">
            <span>Title</span>
            <input
              className="antd-input px-1"
              {...form.register("title")}
              onKeyDown={ignoreFormEnter}
            />
          </div>
          <div className="flex flex-col gap-2">
            <span>Artist</span>
            <input
              className="antd-input px-1"
              {...form.register("artist")}
              onKeyDown={ignoreFormEnter}
            />
          </div>
          <div className="flex flex-col gap-2">
            <span>Album</span>
            <input
              className="antd-input px-1"
              {...form.register("album")}
              onKeyDown={ignoreFormEnter}
            />
          </div>
          <div className="flex flex-col gap-2">
            <span>Start Time</span>
            <input
              className="antd-input px-1"
              placeholder="hh:mm:ss"
              {...form.register("startTime")}
              onKeyDown={ignoreFormEnter}
            />
          </div>
          <div className="flex flex-col gap-2">
            <span>End Time</span>
            <input
              className="antd-input px-1"
              placeholder="hh:mm:ss"
              {...form.register("endTime")}
              onKeyDown={ignoreFormEnter}
            />
          </div>
          <div className="flex flex-col gap-2">
            <span>Embed Thumbnail</span>
            <div className="flex justify-center p-1">
              <div className="relative aspect-video overflow-hidden w-[300px] max-w-[95%]">
                <img
                  className="absolute transform top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]"
                  src={
                    probeMutation.isSuccess
                      ? probeMutation.data?.thumbnailUrl
                      : PLACEHOLDER_IMAGE
                  }
                />
              </div>
            </div>
          </div>
          {!processFileMutation.isSuccess && (
            <button
              className="p-1 antd-btn antd-btn-primary"
              disabled={!file || processFileMutation.isLoading}
            >
              <div className="flex justify-center items-center relative">
                <span>Convert</span>
                {processFileMutation.isLoading && (
                  <div className="absolute right-4 w-4 h-4 antd-spin"></div>
                )}
              </div>
            </button>
          )}
          {processFileMutation.isSuccess && (
            <a
              className="p-1 antd-btn antd-btn-primary"
              href={processFileMutation.data.url}
              download={processFileMutation.data.name}
            >
              <div className="flex justify-center items-center">
                <span>Finished!</span>
              </div>
            </a>
          )}
        </form>
      </div>
    </main>
  );
}
