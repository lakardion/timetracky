import { firefox, expect } from '@playwright/test';

async function saveSignInState() {
  //? Not sure why firefox works properly and chromium does not
  const browser = await firefox.launch();
  const page = await browser.newPage();
  const { VERCEL_URL: url, NODE_ENV } = process.env;
  if (!url) throw new Error('Url is not set');
  const parsedUrl = `${
    NODE_ENV === 'development' ? 'http://' : 'https://'
  }${url}`;
  await page.goto(parsedUrl);
  //timetracky home
  await page.locator('text=Login').click();
  //google sso
  // From here on... we could get two pages depending on the locale... this is ridiculous...
  const { GOOGLE_TEST_USERNAME: username, GOOGLE_TEST_PASSWORD: password } =
    process.env;
  if (!username || !password) throw new Error('Missing google credentials');
  let usernameInput = page.locator('input[type="email"]');
  await usernameInput.fill(username);
  await usernameInput.press('Enter');
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.fill(password);
  await passwordInput.press('Enter');
  await page.context().storageState({ path: './tests/storageState.json' });
  await browser.close();
}

export default saveSignInState;
