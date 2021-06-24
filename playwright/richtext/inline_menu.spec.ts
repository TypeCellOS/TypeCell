import { test, expect } from "@playwright/test";
import { getLastBlock, getNthBlock } from "./util";

const MENU_BUTTONS: { selector: string; regex: RegExp }[] = [
  { selector: "inline-menu-bold", regex: /Bold/ },
  { selector: "inline-menu-italic", regex: /Italic/ },
  { selector: "inline-menu-strike", regex: /Strikethrough/ },
  { selector: "inline-menu-underline", regex: /Underline/ },
  { selector: "inline-menu-link", regex: /Link/ },
  { selector: "inline-menu-comment", regex: /Comment/ },
  { selector: "inline-menu-code", regex: /Inline Code/ },
];

test.describe("inline menu", () => {
  test.beforeEach(async ({ page }) => {
    // Go to the starting url before each test.
    await page.goto("http://localhost:3000/@whateverz/whateverzz?test");

    // Wait for the editor to be visible
    await page.waitForSelector("data-testid=editor", {
      state: "visible",
    });
  });

  test("should show when text is selected", async ({ page }) => {
    const firstBlock = await getNthBlock(page, 0);

    await firstBlock.click();
    await firstBlock.type("test");

    // Menu should not be visible
    let menuVisible = await page.isVisible("data-testid=inline-menu-bold");
    expect(menuVisible).toBeFalsy();

    await firstBlock.press("Shift+ArrowLeft");

    menuVisible = await page.isVisible("data-testid=inline-menu-bold");
    expect(menuVisible).toBeTruthy();
  });

  // Test if tooltip shows for every button
  for (const button of MENU_BUTTONS) {
    test(`tooltip for ${button.selector} button should show on hover`, async ({
      page,
    }) => {
      const firstBlock = await getNthBlock(page, 0);

      await firstBlock.click();
      await firstBlock.type("t");
      await firstBlock.press("Shift+ArrowLeft");

      const buttonElement = await page.waitForSelector(
        `data-testid=${button.selector}`,
        {
          state: "visible",
        }
      );

      await buttonElement.hover();

      const tooltip = await page.waitForSelector(
        `data-testid=${button.selector}-tooltip`,
        {
          state: "visible",
          timeout: 1000,
        }
      );

      expect(await tooltip.textContent()).toMatch(button.regex);
    });
  }
});
