// @ts-ignore
import fs from "node:fs";
import {
  defineConfig,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from "unocss";

// extract mapping from comments in theme.css
const themeSrc: string = fs.readFileSync("./src/styles/theme.css", "utf-8");
const mapping = themeSrc
  .split("-- MAPPING START --")[1]
  .split("-- MAPPING END --")[0]
  .trim()
  .split("\n")
  .map((m) => m.split(":").map((s) => s.trim()));

export default defineConfig({
  theme: {
    colors: Object.fromEntries(mapping),
  },
  variants: [
    {
      // https://github.com/unocss/unocss/blob/f4954d2a2b2a3dc4ad32d1ea098aab07596c55b1/packages/preset-mini/src/_variants/pseudo.ts
      // e.g. aria-invalid:border-error
      match: (input) => {
        const match = input.match(/^(aria-invalid:)/);
        if (match) {
          return {
            matcher: input.slice(match[1].length),
            selector: (s) => `${s}[aria-invalid="true"]`,
          };
        }
        return undefined;
      },
    },
  ],
  shortcuts: {
    spinner: `
      animate-spin
      rounded-full
      border-2 border-gray-500 border-t-gray-300 border-l-gray-300
    `,
    // https://ant.design/components/input/
    input: `
      outline-none
      transition duration-200
      bg-base border border-base-outline
      disabled:(bg-base-disabled border-base-outline-disabled)
      not-disabled:hover:border-primary
      not-disabled:focus:(border-primary ring-2 ring-primary-outline)
      aria-invalid:!border-error
      aria-invalid:focus:(ring-2 !ring-error-outline)
    `,
    // https://ant.design/components/button/
    btn: `
      cursor-pointer
      transition duration-200
      disabled:(cursor-not-allowed opacity-50)
    `,
    "btn-ghost": `
      not-disabled:hover:(text-primary-hover)
      not-disabled:active:(text-primary-active)
    `,
    "btn-default": `
      border border-baseOutline
      not-disabled:hover:(text-primary-hover border-primary-hover)
      not-disabled:active:(text-primary-active border-primary-active)
    `,
    "btn-primary": `
      text-primary-content
      bg-primary
      border border-primary
      not-disabled:hover:(bg-primary-hover border-primary-hover)
      not-disabled:active:(bg-primary-active border-primary-active)
    `,
  },
  presets: [presetUno()],
  transformers: [transformerDirectives(), transformerVariantGroup()],
});
