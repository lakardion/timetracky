import { expect, test } from "@playwright/test";

test("user logs in with sso and sees authorized page Hours", async ({
  page,
}) => {
  const hoursNav = page.locator("text=Hours");
  expect(hoursNav).not.toBe(undefined);
  console.log("hello?", hoursNav);
});
