import {
  BrowserContext,
  BrowserContextOptions,
  test as base,
  expect,
} from "@playwright/test";
import { TestOptions } from "./fixtures";

export const test = base.extend<TestOptions>({
  // Define an option and provide a default value.
  // We can later override it in the config.
  disableWebRTC: [false, { option: true }],

  browser: async ({ browser }, use, workerInfo) => {
    const oldFunc = browser.newContext;
    browser.newContext = async (options?: BrowserContextOptions) => {
      const ret: BrowserContext = await oldFunc.call(browser, options);

      if ((workerInfo.project.use as TestOptions).disableWebRTC) {
        ret.addInitScript({
          content: `window.__TEST_OPTIONS = window.__TEST_OPTIONS || {};`,
        });
        ret.addInitScript({
          content: `window.__TEST_OPTIONS.disableWebRTC = true;`,
        });
      }
      return ret;
    };
    await use(browser);
  },
  context: async ({ context, disableWebRTC }, use) => {
    if (disableWebRTC) {
      context.addInitScript({
        content: `window.__TEST_OPTIONS = window.__TEST_OPTIONS || {};`,
      });
      context.addInitScript({
        content: `window.__TEST_OPTIONS.disableWebRTC = true;`,
      });
    }
    await use(context);
  },
});

export { expect } from "@playwright/test";
