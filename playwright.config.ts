import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: "http://localhost:3001",
    headless: true,
  },
  webServer: {
    command: "PORT=3001 npm run dev",
    url: "http://localhost:3001",
    reuseExistingServer: true,
    timeout: 30000,
  },
});
