import { chromium, FullConfig } from "@playwright/test";

async function saveSignInState() {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();
  const { VERCEL_URL: url, NODE_ENV } = process.env;
  if (!url) throw new Error("Url is not set");
  const parsedUrl = `${
    NODE_ENV === "development" ? "http://" : "https://"
  }${url}`;
  await page.goto(parsedUrl);
  //timetracky home
  const loginButton = page.locator("text=Login");
  await loginButton.click();
  //google sso
  const usernameInput = page.locator('input[name="identifier"]');
  const { GOOGLE_TEST_USERNAME: username, GOOGLE_TEST_PASSWORD: password } =
    process.env;
  if (!username || !password) throw new Error("Missing google credentials");
  await usernameInput.fill(username);
  await usernameInput.press("Enter");
  const passwordInput = page.locator('input[name="password"]');
  await passwordInput.fill(password);
  await passwordInput.press("Enter");
  await page.context().storageState({ path: "./tests/storageState.json" });
  await browser.close();
}

export default saveSignInState;
