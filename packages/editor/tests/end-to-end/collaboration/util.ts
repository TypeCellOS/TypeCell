import { BrowserContext, Page } from "@playwright/test";
import { expect } from "../setup/fixtures";

// We write changes to the editor using this selector
export const writeEditorSelector = 'textarea[aria-roledescription="editor"]';

// We read the editor text contents from this selector
export const emptyParagraphSelector = 'div[data-content-type="paragraph"]';
export const monacoSelector = ".view-lines";

export async function createNotebook(
  title: string,
  aliceContext: BrowserContext,
  bobContext: BrowserContext
) {
  const pageAlice = await aliceContext.newPage();
  await pageAlice.goto("/");

  // const profileButton = pageAlice.locator(
  //   "button[data-testid='profile-button']"
  // );

  // await profileButton.click();

  await pageAlice.click("text=Add a page");
  // Fill :nth-match(input[name="title"], 2)
  // await pageAlice.fill('input[name="title"]', title);
  // Click :nth-match(button:has-text("Create"), 2)
  // await pageAlice.pause();
  // await pageAlice.click('button:has-text("Create")');

  // await pageAlice.pause();
  // wait until alice loads
  const frameAlice = pageAlice.frameLocator("iframe");
  // await pageAlice.pause();
  await frameAlice.locator(emptyParagraphSelector).click();
  await pageAlice.keyboard.type("/code");
  await pageAlice.keyboard.press("Enter");
  // await frameAlice.locator(emptyParagraphSelector).press("Enter");

  await expect(frameAlice.locator(monacoSelector)).toBeAttached();

  const pageBob = await bobContext.newPage();
  //   debugger;
  await pageBob.goto(pageAlice.url());

  // wait until bob loads
  const frameBob = pageBob.frameLocator("iframe");
  await expect(frameBob.locator(monacoSelector)).toBeAttached();

  return { pageAlice, pageBob };
}

export async function selectionSyncs(from: Page, to: Page) {
  const frameFrom = from.frameLocator("iframe");
  const frameTo = to.frameLocator("iframe");

  await frameFrom.locator("text=helloworld").dblclick();

  // const firstLine = await to.waitForSelector("text=helloworld", {
  //   timeout: 2000,
  //   state: "visible",
  // });
  // const remoteSelection = await to.waitForSelector(".yRemoteSelection", {
  //   state: "visible",
  // });

  const loc1 = frameTo.locator("text=helloworld");
  await loc1.waitFor({ state: "visible", timeout: 2000 });
  const bbLine = await loc1.boundingBox();

  const loc2 = frameTo.locator(".yRemoteSelection");
  await loc2.waitFor({ state: "visible", timeout: 200 });
  const bbSelection = await loc2.boundingBox();
  // const bbLine = await firstLine.boundingBox();
  // const bbSelection = await remoteSelection.boundingBox();
  // if (bbLine == null) {
  //   await to.pause();
  // }
  // if (bbSelection == null) {
  //   await to.pause();
  // }
  expect(bbLine!.width).toBeCloseTo(bbSelection!.width, 0);
  expect(bbLine!.height).toBeNear(bbSelection!.height, 5);
  expect(bbLine!.x).toBeNear(bbSelection!.x, 2);
  expect(bbLine!.y).toBeNear(bbSelection!.y, 2);
}

export async function testEditSync(from: Page, to: Page, shouldSync = true) {
  const frameFrom = from.frameLocator("iframe");
  const frameTo = to.frameLocator("iframe");

  await frameFrom.locator(".view-line").click();
  await from.keyboard.press("Meta+a");
  await from.keyboard.press("Control+a");
  await from.keyboard.type("changedtext");

  expect(await frameFrom.locator(monacoSelector).textContent()).toBe(
    "changedtext"
  );

  if (shouldSync) {
    await expect(frameTo.locator("text=changedtext")).toBeAttached();
    expect(from.locator('[data-test="forkAlert"]')).toBeHidden();
  } else {
    // await to.waitForTimeout(timeout);
    await expect(frameTo.locator("text=changedtext")).toBeHidden();
    await expect(from.locator('[data-test="forkAlert"]')).toBeAttached();
  }
}

// before each test, Alice clears the content of the first editor and sets it to "helloworld"
export async function setupBeforeTest(pageAlice: Page, pageBob: Page) {
  // Click .view-line
  const frameAlice = pageAlice.frameLocator("iframe");
  const frameBob = pageBob.frameLocator("iframe");

  await frameAlice.locator(".view-line").click();
  // Press a with modifiers
  await pageAlice.keyboard.press("Meta+a");
  await pageAlice.keyboard.press("Control+a");
  await pageAlice.keyboard.type("helloworld");
  await expect(
    frameBob.getByText("helloworld", { exact: true })
  ).toBeAttached();
}

// at the end of each test, set text to "done" and wait until both are synced
export async function clearAfterTest(pageAlice: Page, pageBob: Page) {
  const frameAlice = pageAlice.frameLocator("iframe");
  const frameBob = pageBob.frameLocator("iframe");

  // Click .view-line
  await frameAlice.locator(".view-line").click();
  // Press a with modifiers
  await pageAlice.keyboard.press("Meta+a");
  await pageAlice.keyboard.press("Control+a");
  await pageAlice.keyboard.type("done");
  await expect(frameBob.locator("text=done")).toBeAttached();
}
