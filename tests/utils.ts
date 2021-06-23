import { Page } from "playwright";

export const getLastBlock = async (page: Page) => {
  const block = await page.$$("[contenteditable=true]");
  return block[block.length - 1];
};
