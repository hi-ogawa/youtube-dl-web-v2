import { useInfiniteQuery } from "@tanstack/react-query";
import { rpcClientQuery } from "../trpc/client";
import { AssetListEntry } from "../utils/asset-utils";
import { cls } from "../utils/misc";
import { getThumbnailUrl } from "../utils/youtube-utils";

export function Component() {
  const assetsQuery = useInfiniteQuery({
    ...rpcClientQuery.listAssets.infiniteQueryOptions((context) => ({
      limit: 5,
      cursor: context?.pageParam as any,
    })),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
  const assets = assetsQuery.data?.pages.flatMap((page) => page.assets);

  return (
    <main className="flex flex-col items-center">
      <div className="w-xl max-w-full flex flex-col gap-4 p-4">
        {assetsQuery.isInitialLoading && (
          <div className="flex justify-center">
            <div className="antd-spin h-8"></div>
          </div>
        )}
        {assetsQuery.isSuccess && (
          <>
            {!assets?.length && "Empty"}
            {assets?.map((e) => (
              <AssetEntryCompoennt key={e.name} asset={e} />
            ))}
          </>
        )}
        {assetsQuery.hasNextPage && (
          <button
            className={cls(
              `antd-btn antd-btn-default p-1`,
              assetsQuery.isFetchingNextPage && "antd-btn-loading"
            )}
            onClick={() => assetsQuery.fetchNextPage()}
          >
            Load more
          </button>
        )}
      </div>
    </main>
  );
}

function AssetEntryCompoennt({ asset }: { asset: AssetListEntry }) {
  return (
    <div
      className="relative w-full flex border"
      style={{ aspectRatio: "36 / 9" }}
    >
      <div className="flex-none w-[44%] relative aspect-video overflow-hidden">
        <a
          href={`https://www.youtube.com/watch?v=${asset.metadata.videoId}`}
          target="_blank"
          className="w-full h-full"
        >
          <img
            className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]"
            src={getThumbnailUrl(asset.metadata.videoId)}
          />
        </a>
      </div>
      <div className="grow p-2 flex flex-col relative text-sm">
        <span className="line-clamp-2 mb-2">{asset.metadata.title}</span>
        <span className="line-clamp-1 text-colorTextSecondary text-xs pr-8">
          {asset.metadata.artist}
        </span>
        <div className="absolute right-2 bottom-1">
          <a
            className="antd-btn antd-btn-ghost i-ri-download-line w-5 h-5"
            href={
              "/api/assets/download?" +
              new URLSearchParams({ name: asset.name })
            }
            download={asset.metadata.filename}
          ></a>
        </div>
      </div>
    </div>
  );
}
