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

// export type StateFile = {
//   user: TestUser;
//   storageState: any;
//   idbState: any;
// };
// function tryLoadState(file: string): StateFile | undefined {
//   try {
//     return JSON.parse(fs.readFileSync(file, "utf-8"));
//   } catch {
//     return undefined;
//   }
// }

// const existingStateAlice = tryLoadState("alice.json");
// const existingStateBobe = tryLoadState("bob.json");

/**
 * Register a user via the interface
 */
async function registerUser(
  page: Page,
  user: { username: string; password: string }
) {
  await page.goto("http://localhost:5173/register");
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

// This fixture exposes information (username / password) of alice / bob
export const testWithUsers = base.extend<
  {},
  { aliceUser: TestUser; bobUser: TestUser }
>({
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
  bobUser: [
    async ({}, use, workerInfo) => {
      const bobUser: TestUser = {
        username: "bob-" + SESSION_ID + "-" + workerInfo.workerIndex,
        password: "myB0bPw123ABC@#$",
      };

      await use(bobUser);
    },
    { scope: "worker" },
  ],
});

// This fixture exposes a registered context for all users (alice / bob)
export const test = testWithUsers.extend<
  {},
  { aliceContext: BrowserContext; bobContext: BrowserContext }
>({
  aliceContext: [
    async ({ browser, aliceUser }, use, workerInfo) => {
      // const existingStateAlice = tryLoadState("alice.json");
      const newContext = await browser.newContext();

      // if (!existingStateAlice) {
      const page = await newContext.newPage();
      await registerUser(page, aliceUser);
      await page.close();
      // fs.writeFileSync(
      //   "alice.json",
      //   JSON.stringify(await newContext.storageState())
      // );
      // }
      // Use the account value.
      await use(newContext);
    },
    { scope: "worker" },
  ],
  bobContext: [
    async ({ browser, bobUser }, use, workerInfo) => {
      const newContext = await browser.newContext();
      const page = await newContext.newPage();
      await registerUser(page, bobUser);
      await page.close();

      // Use the account value.
      await use(newContext);
    },
    { scope: "worker" },
  ],
});
export { expect } from "@playwright/test";
