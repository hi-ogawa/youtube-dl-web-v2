import { useMutation } from "@tanstack/react-query";
import type { PreloadFunction } from "rakkasjs";
import React from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { PLACEHOLDER_IMAGE } from "../components/video-card";
import { ignoreFormEnter } from "../utils/misc";
import { tinyassert } from "../utils/tinyassert";
import { extractCoverArt, runTransform } from "../utils/worker-client";

interface FormType {
  fileList?: FileList;
  title?: string;
  artist?: string;
  album?: string;
  startTime?: string;
  endTime?: string;
}

export default function Page() {
  const form = useForm<FormType>();
  const { fileList, title, artist, album, startTime, endTime } = form.watch();

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
      const output = await extractCoverArt(data);
      const thumbnailUrl = URL.createObjectURL(new Blob([output]));
      return { thumbnailUrl };
    },
    {
      onSuccess: () => {
        // TODO
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
  const runTransformMutation = useMutation(
    async () => {
      tinyassert(file);
      const output = await runTransform(
        file,
        { title, artist, album, startTime, endTime },
        startTime,
        endTime,
        undefined
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
            runTransformMutation.mutate();
          })}
        >
          <div className="flex flex-col gap-2">
            <span>
              Input File{" "}
              <span className="text-sm text-base-content-secondary">
                (.opus)
              </span>
            </span>
            <input type="file" {...form.register("fileList")} />
          </div>
          <div className="border-t m-1"></div>
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
            <span>Start Time</span>
            <input
              className="input px-1"
              placeholder="hh:mm:ss"
              {...form.register("startTime")}
              onKeyDown={ignoreFormEnter}
            />
          </div>
          <div className="flex flex-col gap-2">
            <span>End Time</span>
            <input
              className="input px-1"
              placeholder="hh:mm:ss"
              {...form.register("endTime")}
              onKeyDown={ignoreFormEnter}
            />
          </div>
          <div className="flex flex-col gap-2">
            <span>Embed Thumbnail</span>
            <div className="flex justify-center p-1">
              <img
                src={
                  probeMutation.isSuccess
                    ? probeMutation.data?.thumbnailUrl
                    : PLACEHOLDER_IMAGE
                }
              />
            </div>
          </div>
          <button
            className="p-1 btn btn-primary"
            disabled={!file || runTransformMutation.isLoading}
          >
            Convert
          </button>
        </form>
      </div>
    </main>
  );
}

const preload: PreloadFunction = () => {
  return {
    meta: {
      title: "Edit",
    },
  };
};
Object.assign(Page, { preload });
