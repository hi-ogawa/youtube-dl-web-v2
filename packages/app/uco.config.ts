import presetUno from "@unocss/preset-uno";
import transformerDirectives from "@unocss/transformer-directives";
import { defineConfig } from "unocss";

export default defineConfig({
  presets: [presetUno()],
  transformers: [transformerDirectives()],
});
