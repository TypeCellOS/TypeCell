import { expect, test } from "./setup/userFixtures";

test("is logged in to right account", async ({ aliceContext, aliceUser }) => {
  const page = await aliceContext.newPage();
  await page.goto("/");

  const profileButton = await page.locator(
    "button[data-testid='profile-button']"
  );

  await profileButton.click();

  const userElement = await page.locator("text=@" + aliceUser.username);
  await expect(userElement).toBeVisible();
});
