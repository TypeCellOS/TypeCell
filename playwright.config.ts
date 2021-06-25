import { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  // Look for test files in the "tests" directory, relative to this configuration file
  testDir: "playwright",

  // Each test is given 30 seconds
  timeout: 30000,

  // Forbid test.only on CI
  //   forbidOnly: !!process.env.CI,

  // Limit the number of workers on CI, use default locally
  //   workers: process.env.CI ? 2 : undefined,
  // workers: 1,

  use: {
    // Browser options
    headless: true,
    // slowMo: 100,

    // Context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,

    // Artifacts
    screenshot: "only-on-failure",
    video: "retry-with-video",
  },
};
export default config;
