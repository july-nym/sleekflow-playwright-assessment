import { expect } from '@playwright/test';
import { ssoSteps } from '../config/routes';
import { Given, Then, When } from '../fixtures';

Given('I open the signup form', async ({ signupPage }) => {
  await signupPage.open();
});

Given('signup requests are intercepted in the browser', async ({ signupPage }) => {
  await signupPage.interceptSubmission();
});

When('I enter the email {string}', async ({ signupPage }, email: string) => {
  await signupPage.enterEmail(email);
});

When('I accept the terms', async ({ signupPage }) => {
  await signupPage.acceptTerms();
});

When('I submit the signup form', async ({ signupPage }) => {
  await signupPage.submit();
});

Then('the terms checkbox is not checked', async ({ signupPage }) => {
  await expect(signupPage.locators.termsCheckbox).not.toBeChecked();
});

Then('the Terms of Service and Privacy Policy links are visible', async ({ signupPage }) => {
  await expect(signupPage.locators.termsOfServiceLink).toBeVisible();
  await expect(signupPage.locators.privacyPolicyLink).toBeVisible();
});

Then('the email field shows the error {string}', async ({ signupPage }, message: string) => {
  await expect(signupPage.locators.emailInput).toHaveAttribute('aria-invalid', 'true');
  await expect(signupPage.locators.errorMessage(message)).toBeVisible();
});

Then('the signup form stays on the email step', async ({ page }) => {
  await expect(page).toHaveURL(ssoSteps.signupEmail);
});

Then('the intercepted request has the email {string}', async ({ signupPage }, email: string) => {
  await expect(signupPage.locators.interceptedNotice).toBeVisible();
  expect(signupPage.interceptedForm?.get('email')).toBe(email);
});

Then('the intercepted request records consent to the terms', async ({ signupPage }) => {
  await expect(signupPage.locators.interceptedNotice).toBeVisible();
  expect(signupPage.interceptedForm?.get('ulp-terms-of-service')).toBeTruthy();
});
