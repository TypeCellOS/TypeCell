import { BrowserContext, Page, expect } from "@playwright/test";
import { DEFAULT_PROVIDER } from "./config";
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
 * Register a user via the interface (Matrix UI)
 */
async function registerUserMatrix(
  page: Page,
  user: { username: string; password: string }
) {
  await page.goto("/register");
  const field = page.locator("input[name='username']");
  await field.type(user.username);
  const pwField = page.locator("input[name='password']");
  await pwField.type(user.password);

  const confirmField = page.locator("input[name='confirmPassword']");
  await confirmField.type(user.password);

  const registerBtn = page.locator("button[value='Register']");
  await registerBtn.click();

  // registered + signed in when profile button is visible
  await expect(
    page.locator("button[data-testid='profile-button']")
  ).toBeAttached();
}

/**
 * Register a user via the interface (Supabase UI)
 */
async function registerUserSupabase(
  page: Page,
  user: { username: string; password: string }
) {
  await page.goto("/register");
  const field = page.locator("input[name='email']");
  await field.type(user.username + "@fakeemail.typecell.org");
  const pwField = page.locator("input[name='password']");
  await pwField.type(user.password);

  const registerBtn = page.locator("button[type='submit']");
  await registerBtn.click();

  await expect(page.locator("input[name='username']")).toBeAttached();

  const usernameField = page.locator("input[name='username']");
  await usernameField.type(user.username);

  const setUsernameBtn = page.locator("button[type='submit']");
  await setUsernameBtn.click();

  // registered + signed in when profile button is visible
  await expect(
    page.locator("button[data-testid='profile-button']")
  ).toBeAttached();
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
      if (DEFAULT_PROVIDER === "supabase") {
        await registerUserSupabase(page, aliceUser);
      } else {
        await registerUserMatrix(page, aliceUser);
      }
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
      if (DEFAULT_PROVIDER === "supabase") {
        await registerUserSupabase(page, bobUser);
      } else {
        await registerUserMatrix(page, bobUser);
      }
      await page.close();

      // Use the account value.
      await use(newContext);
    },
    { scope: "worker" },
  ],
});
export { expect } from "@playwright/test";
