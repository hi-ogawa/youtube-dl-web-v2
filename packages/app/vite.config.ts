import rakkas from "rakkasjs/vite-plugin";
import unocss from "unocss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    sourcemap: true,
  },
  plugins: [unocss(), rakkas({ adapter: "vercel" })],
});
