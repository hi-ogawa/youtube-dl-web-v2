import { initTRPC } from "@trpc/server";

const t = initTRPC.create();

export const trpcRouterFactory = t.router;
export const trpcMiddlewareFactory = t.middleware;
export const trpcProcedureBuilder = t.procedure;
