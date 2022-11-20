// @ts-ignore
import fs from "node:fs";
import {
  defineConfig,
  presetIcons,
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
    // cf. https://github.com/unocss/unocss/pull/1816
    aria: {
      invalid: 'invalid="true"',
    },
  },
  shortcuts: {
    spinner: `
      animate-spin
      rounded-full
      border-2 border-gray-500 border-t-gray-300 border-l-gray-300
    `,
    // https://ant.design/components/input/
    input: `
      outline-none
      transition
      bg-base border border-base-outline
      disabled:(bg-base-disabled border-base-outline-disabled)
      not-disabled:hover:border-primary
      not-disabled:focus:(border-primary ring-2 ring-primary-outline)
      aria-invalid:(!border-error focus:(ring-2 !ring-error-outline))
    `,
    // https://ant.design/components/button/
    btn: `
      cursor-pointer
      transition
      disabled:(cursor-not-allowed opacity-50)
    `,
    "btn-ghost": `
      not-disabled:hover:(text-primary-hover)
      not-disabled:active:(text-primary-active)
    `,
    "btn-default": `
      border border-base-outline
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
  presets: [
    presetUno(),
    // for the ease of search ui, use https://remixicon.com/ e.g. i-ri-github-line
    presetIcons({
      extraProperties: {
        display: "inline-block",
      },
    }),
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
});
