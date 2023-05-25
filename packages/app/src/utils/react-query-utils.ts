import type { QueryObserverOptions } from "@tanstack/react-query";

export function usePromiseQueryOpitons<T>(queryFn: () => Promise<T>) {
  return {
    queryKey: ["usePromise", String(queryFn)],
    queryFn,
    staleTime: Infinity,
    cacheTime: Infinity,
  } satisfies QueryObserverOptions;
}
