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

  if (n < 0) n = Math.max(blocks.length + n - 1, 0);

  const block = blocks[n];

  return block;
};

export const randomDocumentUrl = (): string => {
  // Source: https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript?rq=1
  const randomUser = Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, "")
    .substr(0, 5);
  const randomDoc = Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, "")
    .substr(0, 5);

  return `@${randomUser}/${randomDoc}`;
};
