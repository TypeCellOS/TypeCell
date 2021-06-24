import { test, expect } from "@playwright/test";

test("editor should be visible", async ({ page }) => {
  await page.goto("http://localhost:3000/@whatever/whatever?test");

  // Wait till the editor to be loaded
  await page.waitForSelector("data-testid=editor");

  // Assert that the editor is visible
  expect(await page.isVisible("data-testid=editor")).toBeTruthy();
});
