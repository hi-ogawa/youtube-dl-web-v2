import type { GetNextPageParamFunction } from "@tanstack/react-query";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { trpcClient } from "./client";
import type { trpcRoot } from "./server";

// copied from https://github.com/hi-ogawa/ytsub-v3/blob/af2eff04d17f346b9bf417dd0fb42849ef472147/app/trpc/client.ts#L10-L17

type Inputs = inferRouterInputs<typeof trpcRoot>;
type Outputs = inferRouterOutputs<typeof trpcRoot>;

type ReactQueryIntegration = {
  [K in keyof Inputs]: {
    queryKey: K;
    queryOptions: (input: Inputs[K]) => {
      queryKey: unknown[];
      queryFn: () => Promise<Outputs[K]>;
    };
    infiniteQueryOptions: (
      input: Inputs[K],
      options: {
        getNextPageParam: GetNextPageParamFunction<Outputs[K]>;
        setPageParam: (input: Inputs[K], pageParam: unknown) => Inputs[K];
      }
    ) => {
      queryKey: unknown[];
      queryFn: (context: unknown) => Promise<Outputs[K]>;
      getNextPageParam: any;
    };
    mutationKey: K;
    mutationOptions: () => {
      mutationKey: unknown[];
      mutationFn: (input: Inputs[K]) => Promise<Outputs[K]>;
    };
  };
};

// prettier-ignore
export const trpcRQ =
  createGetProxy((k) =>
    createGetProxy(prop => {
      if (prop === "queryKey" || prop === "mutationKey") {
        return k;
      }
      if (prop === "queryOptions") {
        return (input: unknown) => ({
          queryKey: [k, input],
          queryFn: () => (trpcClient as any)[k].query(input),
        })
      }
      if (prop === "infiniteQueryOptions") {
        return (input: unknown, options: any) => ({
          queryKey: [k, input],
          queryFn: ({ pageParam }: any) => (trpcClient as any)[k].query(options.setPageParam(input, pageParam)),
          getNextPageParam: options.getNextPageParam,
        })
      }
      if (prop === "mutationOptions") {
        return () => ({
          mutationKey: [k],
          mutationFn: (input: unknown) => (trpcClient as any)[k].mutate(input),
        })
      }
      console.error({ k, prop });
      throw new Error("invalid trpc react-query call");
    })
  ) as ReactQueryIntegration;

function createGetProxy(
  propHandler: (prop: string | symbol) => unknown
): unknown {
  return new Proxy(
    {},
    {
      get(_target, prop, _receiver) {
        return propHandler(prop);
      },
    }
  );
}
