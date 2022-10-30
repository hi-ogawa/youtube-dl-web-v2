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
  theme: {
    colors: {
      primary: c.blue[500],
      primaryHover: c.blue[400],
      primaryActive: c.blue[600],
      primaryContent: "white",
    },
  },
  shortcuts: {
    spinner: `
      animate-spin
      rounded-full
      border-2 border-gray-500 border-t-gray-300 border-l-gray-300
    `,
    input: `
      border bg-white border-gray-300 disabled:(bg-gray-100 border-gray-200)
    `,
    btn: `
      cursor-pointer
      transition duration-200
      border
      disabled:(cursor-not-allowed opacity-50)
    `,
    "btn-default": `
      border-current
      not-disabled:hover:(text-primary-hover border-primary-hover)
      not-disabled:active:(text-primary-active border-primary-active)
    `,
    "btn-primary": `
      text-primary-content
      bg-primary border-primary
      not-disabled:hover:(bg-primary-hover border-primary-hover)
      not-disabled:active:(bg-primary-active border-primary-active)
    `,
  },
  presets: [preset],
  transformers: [transformerDirectives(), transformerVariantGroup()],
});
