import { useQuery } from "@tanstack/react-query";
import { trpcRQ } from "../trpc/react-query";

export default function Page() {
  // TODO: infinite query
  const assetsQuery = useQuery({
    ...trpcRQ.listAssets.queryOptions({ cursor: undefined }),
  });
  const assets = assetsQuery.data?.assets ?? [];

  return (
    <main className="flex flex-col items-center">
      <div className="w-xl max-w-full flex flex-col gap-4 p-4">
        hello
        {assets.map((e) => (
          <div key={e.key}>{JSON.stringify(e)}</div>
        ))}
      </div>
    </main>
  );
}
