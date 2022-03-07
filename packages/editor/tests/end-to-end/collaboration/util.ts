import { BrowserContext, Page } from "@playwright/test";
import { time } from "console";
import { expect, test } from "../setup/fixtures";

// We write changes to the editor using this selector
export const writeEditorSelector = 'textarea[aria-roledescription="editor"]';

// We read the editor text contents from this selector
export const readEditorSelector = ".view-lines";

export async function createNotebook(
  title: string,
  aliceContext: BrowserContext,
  bobContext: BrowserContext
) {
  const pageAlice = await aliceContext.newPage();
  await pageAlice.goto("/");

  const profileButton = await pageAlice.locator(
    "button[data-testid='profile-button']"
  );

  await profileButton.click();

  await pageAlice.click("text=New notebook");
  // Fill :nth-match(input[name="title"], 2)
  await pageAlice.fill('input[name="title"]', title);
  // Click :nth-match(button:has-text("Create"), 2)
  await pageAlice.click(':nth-match(button:has-text("Create"), 2)');

  // wait until alice loads
  await pageAlice.waitForSelector(readEditorSelector);

  const pageBob = await bobContext.newPage();
  //   debugger;
  await pageBob.goto(pageAlice.url());

  // wait until bob loads
  await pageBob.waitForSelector(readEditorSelector);

  return { pageAlice, pageBob };
}

export async function selectionSyncs(from: Page, to: Page) {
  await from.dblclick("text=helloworld");

  const firstLine = await to.waitForSelector("text=helloworld", {
    timeout: 2000,
  });
  const remoteSelection = await to.waitForSelector(".yRemoteSelection");

  const bbLine = await firstLine.boundingBox();
  const bbSelection = await remoteSelection.boundingBox();

  expect(bbLine.width).toBeCloseTo(bbSelection.width, 0);
  expect(bbLine.height).toBeNear(bbSelection.height, 5);
  expect(bbLine.x).toBeNear(bbSelection.x, 2);
  expect(bbLine.y).toBeNear(bbSelection.y, 2);
}

export async function testEditSync(
  from: Page,
  to: Page,
  timeout: number,
  shouldSync = true
) {
  await from.press(writeEditorSelector, "Meta+a");
  await from.fill(writeEditorSelector, "changedtext");

  expect(await from.textContent(readEditorSelector)).toBe("changedtext");

  if (shouldSync) {
    await to.waitForSelector("text=changedtext", {
      timeout,
    });
    expect(from.locator('[data-test="forkAlert"]')).toBeHidden();
  } else {
    await to.waitForTimeout(timeout);
    expect(to.locator("text=changedtext")).toBeHidden();
    await from.waitForSelector('[data-test="forkAlert"]');
  }
}
