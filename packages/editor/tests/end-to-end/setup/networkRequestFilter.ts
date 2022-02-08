import {
  BrowserContext,
  BrowserContextOptions,
  test as base,
  expect,
} from "@playwright/test";

// https://github.com/developit/microbundle/issues/708, otherwise vscode-lib fails
import "regenerator-runtime/runtime.js";
import { uri } from "vscode-lib";

export function addFilterToBrowserContext(context: BrowserContext) {
  const listener = (request) => {
    const host = uri.URI.parse(request.url()).authority;

    if (
      host === "typecell.org" ||
      host === "www.typecell.org" ||
      host === "mx.typecell.org"
    ) {
      throw new Error("invalid hostname");
    }
    // expect(host).not.toBe("typecell.org");
    // expect(host).not.toBe("www.typecell.org");
    // expect(host).not.toBe("mx.typecell.org");
  };
  // make sure tests don't do requests to production environment
  context.on("request", listener);

  return () => context.off("request", listener);
}

export const test = base.extend({
  // browser: async ({ browser }, use) => {
  //   const oldFunc = browser.newContext;
  //   browser.newContext = async (options?: BrowserContextOptions) => {
  //     const ret = await oldFunc.call(browser, options);
  //     addFilterToBrowserContext(ret);
  //     return ret;
  //   };
  //   await use(browser);
  // },
  context: async ({ context }, use) => {
    const dispose = addFilterToBrowserContext(context);
    await use(context);
    dispose();
  },
});
