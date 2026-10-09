import type { Page } from '@playwright/test';

export function loginLocators(page: Page) {
  return {
    heading: page.getByRole('heading', { name: 'Welcome back' }),
    identifierInput: page.getByRole('textbox', { name: 'Email or username' }),
    continueButton: page.getByRole('button', { name: 'Continue', exact: true }),
    // The SSO can ask for this CAPTCHA instead of a password, e.g. on GitHub-hosted runners.
    captchaInput: page.getByRole('textbox', { name: 'Enter the code shown above' }),
    passwordInput: page.getByRole('textbox', { name: 'Password' }),
    signInButton: page.getByRole('button', { name: 'Sign in', exact: true }),
    errorMessage: (text: string) => page.getByText(text, { exact: true }).last(),
  };
}

export type LoginLocators = ReturnType<typeof loginLocators>;
