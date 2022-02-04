import { test, expect } from "@playwright/test";

test("Sign in button exists", async ({ page }) => {
  await page.goto("/");
  const button = page.locator("header button");
  await expect(button).toHaveText("Sign in");
});

test("Sign in by email", async ({ page }) => {
  await page.goto("/");
  const button = await page.locator("button", { hasText: "Sign in" });

  await button.click();

  const email = page.locator("input[name=email]");
  const password = page.locator("input[type=password]");

  await email.type("typecell.test@gmail.com");
  await password.type("AyKq4j?xoGrdmp5N");

  const continueButton = page.locator("button[type=submit]", {
    hasText: "Continue",
  });

  await continueButton.click();

  const profileButton = await page.locator(
    "button[data-testid='profile-button']"
  );

  await expect(profileButton).toBeVisible();
});
