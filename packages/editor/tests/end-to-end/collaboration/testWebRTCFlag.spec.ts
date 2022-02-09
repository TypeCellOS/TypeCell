import { expect, test } from "../setup/fixtures";

test("webrtc flag is set correctly for alice context", async ({
  aliceContext,
  disableWebRTC,
}) => {
  if (!disableWebRTC) {
    test.skip();
    return;
  }
  const page = await aliceContext.newPage();
  const flags = (await page.evaluate("window.__TEST_OPTIONS")) as any;
  await page.close();

  expect(flags.disableWebRTC).toBe(true);
});

test("webrtc flag is set correctly for clean context", async ({
  context,
  disableWebRTC,
}) => {
  if (!disableWebRTC) {
    test.skip();
    return;
  }
  const page = await context.newPage();
  const flags = (await page.evaluate("window.__TEST_OPTIONS")) as any;
  await page.close();

  expect(flags.disableWebRTC).toBe(true);
});
