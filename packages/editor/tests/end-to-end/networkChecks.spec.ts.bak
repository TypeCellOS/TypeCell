import { test } from "./setup/userFixtures";

test("aliceContext can't navigate to typecell.org", async ({
  aliceContext,
}) => {
  test.fail();
  const page = await aliceContext.newPage();
  await page.goto("https://www.typecell.org");
});

// NOTE: the following two tests also work (that is, they fail successfully)
// but unfortunately PlayWright + networkRequestFilter breaks when enabling multiple of these
// tests at the same time

// test("regular context can't navigate to typecell.org", async ({ context }) => {
//   test.fail();
//   const page = await context.newPage();
//   await page.goto("https://www.typecell.org");
//   await page.close();
// });

// test("new context can't navigate to typecell.org", async ({ browser }) => {
//   test.fail();
//   const context = await browser.newContext();
//   const page = await context.newPage();

//   await page.goto("https://typecell.org");
//   await page.close();
//   await context.close();
// });
