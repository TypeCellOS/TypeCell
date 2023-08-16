import { Page, expect } from "@playwright/test";
import { test } from "../setup/fixtures";
import {
  clearAfterTest,
  createNotebook,
  emptyParagraphSelector,
  selectionSyncs,
  setupBeforeTest,
  testEditSync,
} from "./util";

let pageAlice: Page;
let pageBob: Page;

test.setTimeout(120000);

// before all tests, Alice creates a new notebook
test.beforeAll(async ({ aliceContext, bobContext, bobUser }) => {
  test.setTimeout(60000);
  const ret = await createNotebook("twoWay-private", aliceContext, bobContext);
  pageAlice = ret.pageAlice;
  pageBob = ret.pageBob;

  // give bob permission to edit the document

  await pageAlice.click('svg:has-text("Options")');
  await pageAlice.click("text=Permissions");
  // await pageAlice.pause();
  // await pageAlice.click("text=Find a person...");
  await pageAlice.fill("#react-select-add-user-input", bobUser.username);

  // Click #react-select-add-user-option-0 >> text=@bob-zvghe-0:localhost:8888
  await pageAlice.click(
    `#react-select-add-user-option-0 >> text=@${bobUser.username}`
  );

  await pageAlice.click('button:has-text("Add")');
  await pageAlice.click('button:has-text("Apply")');

  // TODO: would be nice to have a way to apply permissions on the fly with hocuspocus
  await pageBob.reload();
  await expect(
    pageBob.frameLocator("iframe").locator(emptyParagraphSelector)
  ).toBeAttached();
});

test.afterAll(() => {
  pageAlice?.close();
  pageBob?.close();
});

// before each test, Alice clears the content of the first editor and sets it to "helloworld"
test.beforeEach(async ({ disableWebRTC }) => {
  await clearAfterTest(pageAlice, pageBob);
});

// at the end of each test, set text to "done" and wait until both are synced
test.afterEach(async ({ disableWebRTC }) => {
  await setupBeforeTest(pageAlice, pageBob);
});

test.skip("selection syncs from Alice to Bob", async ({
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

test.skip("selection syncs from Bob to Alice", async ({
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
