import type { PreloadFunction } from "rakkasjs";
import { useForm } from "react-hook-form";
import { ignoreFormEnter } from "../utils/misc";

export default function Page() {
  const form = useForm({
    defaultValues: {
      fileList: undefined as undefined | FileList,
      title: "",
      artist: "",
      album: "",
      startTime: "",
      endTime: "",
    },
  });

  return (
    <main className="flex flex-col items-center">
      <div className="w-xl max-w-full flex flex-col gap-4 p-4">
        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit((data) => {
            console.log(data);
          })}
        >
          <div className="flex flex-col gap-2">
            <span>Input File</span>
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
          <button className="p-1 btn btn-primary">Process</button>
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
