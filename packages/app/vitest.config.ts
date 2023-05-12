import { defaultExclude, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [...defaultExclude, "./e2e"],
    setupFiles: ["./src/misc/vitest/setup.ts"],
  },
});
