import { themeScriptPlugin } from "@hiogawa/theme-script/dist/vite";
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
    themeScriptPlugin({
      storageKey: "youtube-dl-web:theme",
      defaultTheme: "dark",
    }),
    vaviteConnect({
      standalone: false,
      serveClientAssetsInDev: true,
      handlerEntry:
        ctx.command === "build"
          ? "./src/server/adapter-cloudflare-workers.ts"
          : "./src/server/adapter-node.ts",
    }),
  ],
  build: {
    outDir: ctx.ssrBuild ? "dist/server" : "dist/client",
    sourcemap: true,
    rollupOptions: {
      external: ["__STATIC_CONTENT_MANIFEST"],
    },
  },
  ssr: {
    optimizeDeps: {
      // workaround transitive cjs deps by aws-sdk
      include: ["fast-xml-parser"],
    },
  },
  clearScreen: false,
}));
