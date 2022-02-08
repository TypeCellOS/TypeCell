// https://github.com/developit/microbundle/issues/708, otherwise vscode-lib fails
import "regenerator-runtime/runtime.js";
import { uri } from "vscode-lib";
import { ensureMatrixIsRunning } from "../util/startMatrixServer";
import { test, expect } from "@playwright/test";

test.beforeAll(async () => {
  await ensureMatrixIsRunning();
});

test.beforeEach(({ context }) => {
  // make sure tests don't do requests to production environment
  context.on("request", (request) => {
    const host = uri.URI.parse(request.url()).authority;
    console.log(host);
    expect(host).not.toBe("typecell.org");
    expect(host).not.toBe("www.typecell.org");
    expect(host).not.toBe("mx.typecell.org");
  });
});

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
