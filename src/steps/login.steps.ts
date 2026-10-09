import { expect } from '@playwright/test';
import { getAppUrl } from '../config/env';
import { ssoSteps } from '../config/routes';
import { Given, Then, When } from '../fixtures';

Given('I open the login form', async ({ loginPage }) => {
  await loginPage.open();
});

const CAPTCHA_SKIP_REASON =
  "SleekFlow's SSO asked for a CAPTCHA, so the password step cannot be reached from this network";

Given('I am on the password step as {string}', async ({ loginPage, $test }, identifier: string) => {
  const reached = await loginPage.goToPasswordStep(identifier);
  $test.skip(!reached, CAPTCHA_SKIP_REASON);
});

Given(
  'I am on the password step with the test account',
  async ({ loginPage, testAccount, $test }) => {
    const reached = await loginPage.goToPasswordStep(testAccount.email);
    $test.skip(!reached, CAPTCHA_SKIP_REASON);
  },
);

When('I continue without an identifier', async ({ loginPage }) => {
  await loginPage.submitIdentifier();
});

When('I sign in without a password', async ({ loginPage }) => {
  await loginPage.signIn();
});

When('I sign in with the password {string}', async ({ loginPage }, password: string) => {
  await loginPage.enterPassword(password);
  await loginPage.signIn();
});

When('I sign in with the test account password', async ({ loginPage, testAccount }) => {
  await loginPage.enterPassword(testAccount.password);
  await loginPage.signIn();
});

Then('the identifier field shows the error {string}', async ({ loginPage }, message: string) => {
  await expect(loginPage.locators.identifierInput).toHaveAttribute('aria-invalid', 'true');
  await expect(loginPage.locators.errorMessage(message)).toBeVisible();
});

Then('the password field shows the error {string}', async ({ loginPage }, message: string) => {
  await expect(loginPage.locators.passwordInput).toHaveAttribute('aria-invalid', 'true');
  await expect(loginPage.locators.errorMessage(message)).toBeVisible();
});

Then('the error {string} is shown', async ({ loginPage }, message: string) => {
  await expect(loginPage.locators.errorMessage(message)).toBeVisible();
});

Then('the login form stays on the identifier step', async ({ page }) => {
  await expect(page).toHaveURL(ssoSteps.loginIdentifier);
});

Then('the login form stays on the password step', async ({ page }) => {
  await expect(page).toHaveURL(ssoSteps.loginPassword);
});

Then('the SleekFlow app opens', async ({ page, loginPage }) => {
  const appOrigin = new URL(getAppUrl()).origin;
  await expect(page).toHaveURL(
    (url) => url.origin === appOrigin && !url.searchParams.has('screen_hint'),
    { timeout: 30_000 },
  );
  await expect(loginPage.locators.passwordInput).toHaveCount(0);
});
