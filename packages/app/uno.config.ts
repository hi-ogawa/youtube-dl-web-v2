import presetUno from "@unocss/preset-uno";
import transformerDirectives from "@unocss/transformer-directives";
import transformerVariantGroup from "@unocss/transformer-variant-group";
import { defineConfig } from "unocss";

const preset = presetUno();
const c = preset.theme?.colors as any;

export default defineConfig({
  // color system ideas
  // https://github.com/chakra-ui/chakra-ui-docs/blob/3660460dcb617a256fa7ed754358f241101cdbe2/theme.ts#L6-L19
  // https://github.com/chakra-ui/chakra-ui/blob/8705372a014bfd7073fe8012a46d7aa22904370b/packages/components/theme/src/semantic-tokens.ts
  // https://github.com/ant-design/ant-design/blob/master/components/style/themes/default.less
  // https://daisyui.com/docs/colors/
  // https://code.visualstudio.com/api/references/theme-color
  theme: {
    colors: {
      primary: c.blue[500],
      primaryHover: c.blue[400],
      primaryActive: c.blue[600],
      primaryOutline: c.blue[100],
      primaryContent: "white",
      error: c.red[500],
      errorOutline: c.red[100],
    },
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
      border bg-white border-gray-300 disabled:(bg-gray-100 border-gray-200)
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
      border border-current
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
  presets: [preset],
  transformers: [transformerDirectives(), transformerVariantGroup()],
});
