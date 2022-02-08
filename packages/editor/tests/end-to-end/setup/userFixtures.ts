import { BrowserContext, Page } from "@playwright/test";
import { test as base } from "./networkRequestFilter";

const SESSION_ID = Math.random()
  .toString(36)
  .replace(/[^a-z]+/g, "")
  .substring(0, 5);

export type TestUser = {
  username: string;
  password: string;
};

async function registerUser(
  page: Page,
  user: { username: string; password: string }
) {
  await page.goto("http://localhost:3000/register");
  const field = await page.waitForSelector("input[name='username']");
  await field.type(user.username);
  const pwField = page.locator("input[name='password']");
  await pwField.type(user.password);

  const confirmField = page.locator("input[name='confirmPassword']");
  await confirmField.type(user.password);

  const registerBtn = page.locator("button[value='Register']");
  await registerBtn.click();

  // registered + signed in when profile button is visible
  await page.waitForSelector("button[data-testid='profile-button']");
}

export const testWithUsers = base.extend<{}, { aliceUser: TestUser }>({
  aliceUser: [
    async ({}, use, workerInfo) => {
      const aliceUser: TestUser = {
        username: "alice-" + SESSION_ID + "-" + workerInfo.workerIndex,
        password: "myPw123ABC@#$",
      };

      await use(aliceUser);
    },
    { scope: "worker" },
  ],
});

export const test = testWithUsers.extend<{}, { aliceContext: BrowserContext }>({
  aliceContext: [
    async ({ browser }, use, workerInfo) => {
      const aliceUser: TestUser = {
        username: "alice-" + SESSION_ID + "-" + workerInfo.workerIndex,
        password: "myPw123ABC@#$",
      };
      const newContext = await browser.newContext();
      const page = await newContext.newPage();
      await registerUser(page, aliceUser);
      await page.close();

      // Use the account value.
      await use(newContext);
    },
    { scope: "worker" },
  ],
});
export { expect } from "@playwright/test";
