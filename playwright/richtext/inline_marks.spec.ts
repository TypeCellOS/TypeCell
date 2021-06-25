import { test, expect } from "@playwright/test";
import { getFirstBlock, randomDocumentUrl } from "./util";

const MARKS: { name: string; elementSelector: string; testId: string }[] = [
  { name: "bold", elementSelector: "strong", testId: "inline-menu-bold" },
  { name: "italic", elementSelector: "em", testId: "inline-menu-italic" },
  { name: "strike", elementSelector: "s", testId: "inline-menu-strike" },
  { name: "code", elementSelector: "code", testId: "inline-menu-code" },
  { name: "underline", elementSelector: "u", testId: "inline-menu-underline" },
];

test.describe("inline menu button should toggle", () => {
  test.beforeEach(async ({ page }) => {
    // Go to the starting url before each test.
    await page.goto(`http://localhost:3000/${randomDocumentUrl()}?test`);

    // Wait for the editor to be visible
    await page.waitForSelector("data-testid=editor", {
      state: "visible",
    });
  });

  for (const mark of MARKS) {
    test(`${mark.name} mark for selected text`, async ({ page }) => {
      const firstBlock = await getFirstBlock(page);

      await firstBlock.click();
      await firstBlock.type("abcd");
      await firstBlock.press("Shift+ArrowLeft");
      await firstBlock.press("Shift+ArrowLeft");

      const button = await page.waitForSelector(`data-testid=${mark.testId}`);
      await button.click();

      const markElement = await firstBlock.waitForSelector(
        mark.elementSelector,
        {
          state: "visible",
          timeout: 1000,
        }
      );

      expect(await markElement.innerText()).toEqual("cd");

      // Assert that the initial text is preserved correctly
      expect(await firstBlock.innerText()).toEqual("abcd");

      await firstBlock.press("Shift+ArrowRight");
      await button.click();

      expect(await markElement.innerText()).toEqual("c");

      // Assert that the initial text is preserved correctly
      expect(await firstBlock.innerText()).toEqual("abcd");
    });
  }
});
