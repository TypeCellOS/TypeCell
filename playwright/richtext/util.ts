import { Page } from "@playwright/test";

export const getFirstBlock = async (page: Page) => {
  return getNthBlock(page, 0);
};

export const getLastBlock = async (page: Page) => {
  const blocks = await page.$$("[data-cy=block]");

  if (blocks.length === 0) throw new Error("No blocks were found");

  const lastBlock = blocks[blocks.length - 1];

  return lastBlock;
};

export const getNthBlock = async (page: Page, n: number) => {
  const blocks = await page.$$("[data-cy=block]");

  if (blocks.length === 0) throw new Error("No blocks were found");

  if (n < 0) n = Math.max(blocks.length + n, 0);

  const block = blocks[0];

  return block;
};
