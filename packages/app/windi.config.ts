import { defineConfig } from "windicss/helpers";
import plugin from "windicss/plugin";
import pluginLineClamp from "windicss/plugin/line-clamp";

export default defineConfig({
  shortcuts: {
    spinner:
      "animate-spin rounded-full border-2 border-gray-500 border-top-gray-300 border-left-gray-300",
  },
  plugins: [
    pluginLineClamp,
    plugin(({ addVariant }) => {
      // e.g. aria-disabled:pointer-events-none
      addVariant("aria-disabled", ({ style }) => {
        // don't know what I'm doing, but imitating https://github.com/windicss/windicss/blob/cf3067b9272704adab30d568bdaa5f64bd44b7b5/src/lib/variants/state.ts#L53
        return style.wrapSelector(
          (selector) =>
            `[aria-disabled="true"] ${selector}, [aria-disabled="true"]${selector}`
        );
      });
    }),
  ],
});
