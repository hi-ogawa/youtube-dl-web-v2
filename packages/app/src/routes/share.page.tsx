import { useMutation, useQuery } from "@tanstack/react-query";
import { trpcClient } from "../trpc/client";
import { trpcRQ } from "../trpc/react-query";
import { triggerDownloadClick } from "../utils/browser-utils";
import { Asset } from "../utils/s3-utils";
import { getThumbnailUrl } from "../utils/youtube-utils";

export default function Page() {
  // TODO: paginate
  // TODO: spinner
  const assetsQuery = useQuery({
    ...trpcRQ.listAssets.queryOptions({ cursor: undefined }),
  });
  const assets = assetsQuery.data?.assets ?? [];

  return (
    <main className="flex flex-col items-center">
      <div className="w-xl max-w-full flex flex-col gap-4 p-4">
        {assets.length === 0 && "Empty"}
        {assets.map((e) => (
          <AssetEntryCompoennt asset={e} />
        ))}
      </div>
    </main>
  );
}

export function AssetEntryCompoennt({ asset }: { asset: Asset }) {
  const downloadMutation = useMutation({
    mutationFn: async () => {
      const url = await trpcClient.getDownloadUrl.mutate({ key: asset.key });
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
            className="antd-btn antd-btn-ghost i-ri-download-line w-5 h-5"
            onClick={() => downloadMutation.mutate()}
          />
        </div>
      </div>
    </div>
  );
}
