import { expect, test } from "@playwright/test";

test("testing?", async ({ page }) => {
  const hoursNav = page.locator("text=Hours");
  expect(hoursNav).not.toBe(undefined);
  console.log("hello?", hoursNav);
});
