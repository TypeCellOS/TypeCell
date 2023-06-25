import { Page, expect } from "@playwright/test";
import { test } from "../setup/fixtures";
import {
  createNotebook,
  readEditorSelector,
  selectionSyncs,
  testEditSync,
  writeEditorSelector,
} from "./util";

let pageAlice: Page;
let pageBob: Page;

test.setTimeout(120000);

// before all tests, Alice creates a new notebook
test.beforeAll(async ({ aliceContext, bobContext }) => {
  test.setTimeout(60000);
  const ret = await createNotebook("twoWay-public", aliceContext, bobContext);
  pageAlice = ret.pageAlice;
  pageBob = ret.pageBob;

  await pageAlice.click('svg:has-text("Options")');
  await pageAlice.click("text=Permissions");

  // set notebook to public
  await pageAlice.click('[aria-label="open"]');
  // await pageAlice.pause();
  // pageAlice.locator("text=Anyone can view and edit >> visible=true")
  await pageAlice.click(
    "text=Anyone can view and edit >> visible=true >> nth=-1"
  );

  await pageAlice.click('button:has-text("Apply")');

  // TODO: would be nice to have a way to apply permissions on the fly with hocuspocus
  await pageBob.reload();
  await expect(pageBob.locator(readEditorSelector)).toBeAttached();
});

test.afterAll(() => {
  pageAlice?.close();
  pageBob?.close();
});

// before each test, Alice clears the content of the first editor and sets it to "helloworld"
test.beforeEach(async ({ disableWebRTC }) => {
  // Click .view-line
  await pageAlice.click(".view-line");
  // Press a with modifiers
  await pageAlice.press(writeEditorSelector, "Meta+a");
  await pageAlice.fill(writeEditorSelector, "helloworld");
  await expect(pageBob.locator("text=helloworld")).toBeAttached();
});

// at the end of each test, set text to "done" and wait until both are synced
test.afterEach(async ({ disableWebRTC }) => {
  // Click .view-line
  await pageAlice.click(".view-line");
  // Press a with modifiers
  await pageAlice.press(writeEditorSelector, "Meta+a");
  await pageAlice.fill(writeEditorSelector, "done");
  await expect(pageBob.locator("text=done")).toBeAttached();
});

test("selection syncs from Alice to Bob", async ({
  aliceContext,
  bobContext,
  disableWebRTC,
}) => {
  if (disableWebRTC) {
    test.skip();
    return;
  }
  await selectionSyncs(pageAlice, pageBob);
  // select content
  // TODO: consistent username + colors for screenshots
  //   expect(await pageBob.screenshot()).toMatchSnapshot("sync-selection.bob.png");
});

test("selection syncs from Bob to Alice", async ({
  aliceContext,
  bobContext,
  disableWebRTC,
}) => {
  if (disableWebRTC) {
    test.skip();
    return;
  }
  await selectionSyncs(pageBob, pageAlice);
  // select content
  // TODO: consistent username + colors for screenshots
  //   expect(await pageBob.screenshot()).toMatchSnapshot("sync-selection.bob.png");
});

test("changes sync from Alice to Bob", async ({
  aliceContext,
  bobContext,
  disableWebRTC,
}) => {
  await testEditSync(pageAlice, pageBob);
  // select content
  // TODO: consistent username + colors for screenshots
  //   expect(await pageBob.screenshot()).toMatchSnapshot("sync-selection.bob.png");
});

test("changes sync from Bob to Alice", async ({
  aliceContext,
  bobContext,
  disableWebRTC,
}) => {
  await testEditSync(pageBob, pageAlice);
  // select content
  // TODO: consistent username + colors for screenshots
  //   expect(await pageBob.screenshot()).toMatchSnapshot("sync-selection.bob.png");
});
