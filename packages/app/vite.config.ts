import globRoutesPlugin from "@hiogawa/vite-glob-routes";
import importIndexHtmlPlugin from "@hiogawa/vite-import-index-html";
import vaviteConnect from "@vavite/connect";
import react from "@vitejs/plugin-react";
import unocss from "unocss/vite";
import { defineConfig } from "vite";

export default defineConfig((ctx) => ({
  plugins: [
    unocss(),
    react(),
    globRoutesPlugin({ root: "/src/routes" }),
    importIndexHtmlPlugin(),
    vaviteConnect({
      standalone: false,
      serveClientAssetsInDev: true,
      handlerEntry: "./src/server/entry-connect.ts",
    }),
  ],
  build: {
    outDir: ctx.ssrBuild ? "dist/server" : "dist/client",
    sourcemap: true,
  },
  ssr: {
    optimizeDeps: {
      // workaround transitive cjs deps by aws-sdk
      include: ["fast-xml-parser"],
    },
  },
  clearScreen: false,
}));
