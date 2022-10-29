import rakkas from "rakkasjs/vite-plugin";
import { defineConfig } from "vite";
import windicss from "vite-plugin-windicss";

export default defineConfig({
  base: "./",
  build: {
    sourcemap: true,
  },
  plugins: [windicss(), rakkas({ adapter: "vercel" })],
  worker: {
    // workaround for iife worker bug with `?url` https://github.com/vitejs/vite/issues/9879
    format: "es",
  },
});
