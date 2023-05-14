import process from "node:process";
import { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: "./e2e",
  use: {
    baseURL: `http://localhost:15173`,
    trace: process.env["E2E_TRACE"] ? "on" : "off",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        // https://github.com/microsoft/playwright/issues/1086#issuecomment-592227413
        viewport: null, // adapt to browser window size specified below
        launchOptions: {
          args: ["--window-size=600,800"],
        },
      },
    },
  ],
  webServer: {
    command: `pnpm dev-e2e >> e2e.log 2>&1`,
    port: 15173,
    reuseExistingServer: true,
  },
};

export default config;
