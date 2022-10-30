import unocss from "@unocss/vite";
import rakkas from "rakkasjs/vite-plugin";
import { defineConfig } from "vite";
import unocssConfig from "./uco.config";

export default defineConfig({
  base: "./",
  build: {
    sourcemap: true,
  },
  plugins: [unocss(unocssConfig), rakkas({ adapter: "vercel" })],
  worker: {
    // workaround for iife worker bug with `?url` https://github.com/vitejs/vite/issues/9879
    format: "es",
  },
});
