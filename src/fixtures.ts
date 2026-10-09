import { createBdd, test as base } from 'playwright-bdd';
import { MISSING_TEST_ACCOUNT, readTestAccount, type TestAccount } from './config/env';
import { LoginPage } from './pages/login.page';
import { SignupPage } from './pages/signup.page';

type Fixtures = {
  signupPage: SignupPage;
  loginPage: LoginPage;
  testAccount: TestAccount;
};

export const test = base.extend<Fixtures>({
  signupPage: async ({ page }, use) => {
    await use(new SignupPage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  // Scenarios that use the account are skipped before their first step when it is not configured.
  testAccount: async ({}, use, testInfo) => {
    const account = readTestAccount();
    testInfo.skip(!account, MISSING_TEST_ACCOUNT);
    await use(account!);
  },
});

export const { Given, When, Then } = createBdd(test);
