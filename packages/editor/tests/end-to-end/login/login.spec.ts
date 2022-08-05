import { expect, test } from "../setup/fixtures";

test("Sign in button exists", async ({ page }) => {
  await page.goto("/");
  const button = page.locator("header button");
  await expect(button).toHaveText("Sign in");
});

test("Sign in by email", async ({ page, aliceUser, aliceContext }) => {
  // aliceContext is needed here for registration,
  // but we don't use it here since we test a clean browser

  // eslint-disable-next-line no-self-assign
  aliceContext = aliceContext;

  await page.goto("/");
  const button = page.locator("button", { hasText: "Sign in" });

  await button.click();

  // sign in by username instead of email
  await page.locator("text=Email address").click();
  await page.waitForTimeout(100);
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");

  // enter username / password
  const email = page.locator("input[name=username]");
  const password = page.locator("input[type=password]");

  await email.type(aliceUser.username);
  await password.type(aliceUser.password);

  const continueButton = page.locator("button[type=submit]", {
    hasText: "Continue",
  });

  await continueButton.click();

  const profileButton = page.locator("button[data-testid='profile-button']");

  await expect(profileButton).toBeVisible();

  await profileButton.click();

  const userElement = page.locator("text=@" + aliceUser.username);
  await expect(userElement).toBeVisible();
});
