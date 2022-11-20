import process from "node:process";
import { PlaywrightTestConfig } from "@playwright/test";

const PORT = process.env["PORT"] ? Number(process.env["PORT"]) : 5173;

const config: PlaywrightTestConfig = {
  testDir: "./e2e",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: process.env["E2E_TRACE"] ? "on" : "off",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
      },
    },
  ],
  webServer: {
    command: `pnpm dev >> e2e.log 2>&1`,
    port: PORT,
    env: { PORT: `${PORT}` },
    reuseExistingServer: true,
  },
};

export default config;
