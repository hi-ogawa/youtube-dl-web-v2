import unocss from "@unocss/vite";
import rakkas from "rakkasjs/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    sourcemap: true,
  },
  plugins: [unocss(), rakkas({ adapter: "vercel" })],
  worker: {
    // workaround for iife worker bug with `?url` https://github.com/vitejs/vite/issues/9879
    format: "es",
  },
});
