import { viteGlobRoutes } from "@hiogawa/vite-glob-routes";
import rakkas from "rakkasjs/vite-plugin";
import unocss from "unocss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    sourcemap: true,
  },
  plugins: [
    unocss(),
    viteGlobRoutes({ root: "/src/routes" }),
    rakkas({ adapter: "vercel" }),
  ],
});
