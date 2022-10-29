import type React from "react";

export function VideoCard(props: {
  imageUrl: string;
  title: React.ReactNode;
  uploader: React.ReactNode;
}) {
  /*
    Layout

    <- 16 -> <--- 20 --->
    ↑        ↑
    9 (cover)|
    ↓        ↓
   */

  return (
    <div
      className="relative w-full flex border bg-white"
      style={{ aspectRatio: "36 / 9" }}
    >
      <div className="flex-none w-[44%] relative aspect-video overflow-hidden">
        <div className="w-full h-full">
          <img
            className="absolute transform top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]"
            src={props.imageUrl}
          />
        </div>
      </div>
      <div className="grow p-2 flex flex-col relative text-sm">
        <div className="line-clamp-2 mb-2">{props.title}</div>
        <div className="line-clamp-1 text-gray-600 pr-8">{props.uploader}</div>
      </div>
    </div>
  );
}
