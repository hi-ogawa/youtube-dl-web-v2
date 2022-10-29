import presetUno from "@unocss/preset-uno";
import transformerDirectives from "@unocss/transformer-directives";
import { defineConfig } from "unocss";

export default defineConfig({
  shortcuts: {
    spinner:
      "animate-spin rounded-full border-2 border-gray-500 border-t-gray-300 border-l-gray-300",
  },
  presets: [presetUno()],
  transformers: [transformerDirectives()],
});
