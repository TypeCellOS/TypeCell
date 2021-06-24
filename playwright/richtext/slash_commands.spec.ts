import { test, expect } from "@playwright/test";
import { getLastBlock, getNthBlock } from "./util";

const defaultCommands = [
  "Heading",
  "Heading 2",
  "Heading 3",
  "Heading 4",
  "Heading 5",
  "Heading 6",
  "Paragraph",
  "Code Block",
  "TypeCell",
  "Bullet List",
  "Ordered List",
  "Block Quote",
  "Horizontal Rule",
  "Table",
];

test.describe("slash-command menu", () => {
  test.beforeEach(async ({ page }) => {
    // Go to the starting url before each test.
    await page.goto("http://localhost:3000/@whateverz/whateverzz?test");

    // Wait for the editor to be visible
    await page.waitForSelector("data-testid=editor", {
      state: "visible",
    });
  });

  test("should show when / is typed", async ({ page }) => {
    // Menu should not be visible
    let menuVisible = await page.isVisible("data-testid=suggestion-menu");

    expect(menuVisible).toBeFalsy();

    const firstBlock = await getNthBlock(page, 0);

    await firstBlock.click();
    await firstBlock.type("/");

    menuVisible = await page.isVisible("data-testid=suggestion-menu");

    expect(menuVisible).toBeTruthy();
  });

  test("should hide when / is removed", async ({ page }) => {
    const firstBlock = await getNthBlock(page, 0);

    await firstBlock.click();
    await firstBlock.type("/");

    expect(await page.isVisible("data-testid=suggestion-menu")).toBeTruthy();

    await firstBlock.press("Backspace");

    // Wait for the fade out animation to finish
    await page.waitForTimeout(1000);

    expect(await page.isVisible("data-testid=suggestion-menu")).toBeFalsy();
  });

  test("should hide when no matches are found and more than 3 characters are typed", async ({
    page,
  }) => {
    const firstBlock = await getNthBlock(page, 0);

    await firstBlock.click();
    await firstBlock.type("/h1");

    expect(await page.isVisible("data-testid=suggestion-menu")).toBeTruthy();

    await firstBlock.type("~~~~");

    // Wait for the fade out animation to finish
    await page.waitForTimeout(1000);

    expect(await page.isVisible("data-testid=suggestion-menu")).toBeFalsy();
  });

  for (const commandName of defaultCommands) {
    test(`should filter ${commandName} command properly`, async ({ page }) => {
      const lastBlock = await getLastBlock(page);

      // Type command
      await lastBlock.click();
      await lastBlock.type(`/${commandName}`);

      expect(
        await page.isVisible("data-testid=selected-suggestion")
      ).toBeTruthy();
      expect(await page.isVisible(`text=${commandName}`));
    });
  }

  for (const heading of ["h1", "h2", "h3", "h4", "h5", "h6"]) {
    test(`should create ${heading} properly`, async ({ page }) => {
      const lastBlock = await getLastBlock(page);

      // Type command in trailing paragraph and press enter
      await lastBlock.click();
      await lastBlock.type(`/${heading}`);
      await lastBlock.press("Enter");

      // Check whether the appropriate heading element exists in the block we typed in
      const secondToLastBlock = await getNthBlock(page, -1);

      const headingElement = await secondToLastBlock.$(heading);
      expect(await headingElement.isVisible()).toBeTruthy();
    });
  }
});
