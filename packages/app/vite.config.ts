import { viteGlobRoutes } from "@hiogawa/vite-glob-routes";
import vaviteConnect from "@vavite/connect";
import react from "@vitejs/plugin-react";
import unocss from "unocss/vite";
import { defineConfig } from "vite";

export default defineConfig((ctx) => ({
  plugins: [
    unocss(),
    react(),
    viteGlobRoutes({ root: "/src/routes" }),
    vaviteConnect({
      standalone: false,
      serveClientAssetsInDev: true,
      handlerEntry:
        ctx.command === "build"
          ? "./src/server/entry-vercel-edge.ts"
          : "./src/server/entry-connect.ts",
    }),
  ],
  build: {
    outDir: ctx.ssrBuild ? "dist/server" : "dist/client",
    sourcemap: true,
  },
  ssr: {
    // TODO: "node" doesn't bundle raw string import (index.html?raw)?
    target: "webworker",
  },
  clearScreen: false,
}));
