import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { rpcClient, rpcClientQuery } from "../trpc/client";
import { triggerDownloadClick } from "../utils/browser-utils";
import { cls } from "../utils/misc";
import { Asset } from "../utils/s3-utils";
import { getThumbnailUrl } from "../utils/youtube-utils";

export function Component() {
  const assetsQuery = useInfiniteQuery({
    ...rpcClientQuery.listAssets.infiniteQueryOptions(
      { limit: 5 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        setPageParam: (input, pageParam) => ({
          ...input,
          cursor: pageParam as any,
        }),
      }
    ),
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
              <AssetEntryCompoennt asset={e} />
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

function AssetEntryCompoennt({ asset }: { asset: Asset }) {
  const downloadMutation = useMutation({
    mutationFn: async () => {
      const url = await rpcClient.getDownloadUrl({ key: asset.key });
      triggerDownloadClick({ href: url });
    },
  });

  return (
    <div
      className="relative w-full flex border"
      style={{ aspectRatio: "36 / 9" }}
    >
      <div className="flex-none w-[44%] relative aspect-video overflow-hidden">
        <a
          href={`https://www.youtube.com/watch?v=${asset.videoId}`}
          target="_blank"
          className="w-full h-full"
        >
          <img
            className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]"
            src={getThumbnailUrl(asset.videoId)}
          />
        </a>
      </div>
      <div className="grow p-2 flex flex-col relative text-sm">
        <span className="line-clamp-2 mb-2">{asset.title}</span>
        <span className="line-clamp-1 text-colorTextSecondary text-xs pr-8">
          {asset.artist}
        </span>
        <div className="absolute right-2 bottom-1">
          <button
            className={cls(
              "antd-btn antd-btn-ghost w-5 h-5",
              downloadMutation.isLoading ? "antd-spin" : "i-ri-download-line"
            )}
            onClick={() => downloadMutation.mutate()}
          />
        </div>
      </div>
    </div>
  );
}
