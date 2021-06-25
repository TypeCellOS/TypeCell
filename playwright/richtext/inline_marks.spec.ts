import { test, expect } from "@playwright/test";
import { getFirstBlock, randomDocumentUrl } from "./util";

test.describe("", () => {
  test.beforeEach(async ({ page }) => {
    // Go to the starting url before each test.
    await page.goto(`http://localhost:3000/${randomDocumentUrl()}?test`);

    // Wait for the editor to be visible
    await page.waitForSelector("data-testid=editor", {
      state: "visible",
    });
  });

  test("bold button should toggle bold mark for selected text", async ({
    page,
  }) => {
    const firstBlock = await getFirstBlock(page);

    await firstBlock.click();
    await firstBlock.type("abcd");
    await firstBlock.press("Shift+ArrowLeft");
    await firstBlock.press("Shift+ArrowLeft");

    const boldButton = await page.waitForSelector(
      "data-testid=inline-menu-bold"
    );
    await boldButton.click();

    const strongMark = await firstBlock.waitForSelector("strong", {
      state: "visible",
      timeout: 1000,
    });

    expect(await strongMark.innerText()).toEqual("cd");

    // Assert that the initial text is preserved correctly
    expect(await firstBlock.innerText()).toEqual("abcd");

    await firstBlock.press("Shift+ArrowRight");
    await boldButton.click();

    expect(await strongMark.innerText()).toEqual("c");

    // Assert that the initial text is preserved correctly
    expect(await firstBlock.innerText()).toEqual("abcd");
  });
});
