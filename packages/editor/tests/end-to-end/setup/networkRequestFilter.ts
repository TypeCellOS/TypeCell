import {
  BrowserContext,
  BrowserContextOptions,
  Request,
} from "@playwright/test";
import { uri } from "vscode-lib";
import { test as base } from "./scriptSetup";

export function addFilterToBrowserContext(context: BrowserContext) {
  const listener = (request: Request) => {
    const host = uri.URI.parse(request.url()).authority;

    if (
      host === "typecell.org" ||
      host === "www.typecell.org" ||
      host === "mx.typecell.org"
    ) {
      throw new Error("trying to hit prod urls in test");
    }
  };
  // make sure tests don't do requests to production environment
  context.on("request", listener);

  return () => context.off("request", listener);
}

// A fixture that overrides the built-in
// context and browser options
// to make sure no network requests are made against prod environments
export const test = base.extend({
  browser: async ({ browser }, use) => {
    const oldFunc = browser.newContext;
    browser.newContext = async (options?: BrowserContextOptions) => {
      const ret = await oldFunc.call(browser, options);
      addFilterToBrowserContext(ret);
      return ret;
    };
    await use(browser);
  },
  context: async ({ context }, use) => {
    addFilterToBrowserContext(context);
    await use(context);
  },
});

export { expect } from "@playwright/test";
