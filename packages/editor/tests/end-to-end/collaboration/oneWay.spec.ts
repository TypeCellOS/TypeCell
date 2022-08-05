import { Page } from "@playwright/test";
import { test } from "../setup/fixtures";
import {
  createNotebook,
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
  const ret = await createNotebook("oneWay", aliceContext, bobContext);
  pageAlice = ret.pageAlice;
  pageBob = ret.pageBob;
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
  await pageBob.waitForSelector("text=helloworld", {
    timeout: disableWebRTC ? 5000 : 2000,
  });
});

// at the end of each test, set text to "done" and wait until both are synced
test.afterEach(async ({ disableWebRTC }) => {
  // Click .view-line
  await pageAlice.click(".view-line");
  // Press a with modifiers
  await pageAlice.press(writeEditorSelector, "Meta+a");
  await pageAlice.fill(writeEditorSelector, "done");
  await pageBob.waitForSelector("text=done", {
    timeout: disableWebRTC ? 5000 : 2000,
  });
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
  await testEditSync(pageAlice, pageBob, disableWebRTC ? 5000 : 2000);
  // select content
  // TODO: consistent username + colors for screenshots
  //   expect(await pageBob.screenshot()).toMatchSnapshot("sync-selection.bob.png");
});

test("changes don't sync from Bob to Alice", async ({
  aliceContext,
  bobContext,
  disableWebRTC,
}) => {
  await testEditSync(pageBob, pageAlice, disableWebRTC ? 5000 : 2000, false);
  // select content
  // TODO: consistent username + colors for screenshots
  //   expect(await pageBob.screenshot()).toMatchSnapshot("sync-selection.bob.png");
});
