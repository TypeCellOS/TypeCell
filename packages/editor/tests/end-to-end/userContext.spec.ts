import { expect, test } from "./setup/userFixtures";

test("is logged in to right account", async ({ aliceContext, aliceUser }) => {
  const page = await aliceContext.newPage();
  await page.goto("/");

  const profileButton = page.locator("button[data-testid='profile-button']");

  await profileButton.click();

  const userElement = page.locator("text=@" + aliceUser.username);
  await expect(userElement).toBeVisible();
});
