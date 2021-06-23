import { test, expect } from "@playwright/test";
import { getLastBlock } from "./utils";

test("basic test", async ({ page }) => {
  await page.goto("localhost:3000/@whatever/whatever?test");

  await page.waitForSelector("[data-test-id=block]").then(async (_) => {
    // Retrieves a block
    const block = await getLastBlock(page);
    await block.click();
    await block.type("- ");

    const listItem = await page.$("[data-test-id=list-item-block]");
    console.log(listItem);
    expect(listItem).not.toBeNull();
  });
});
