import type { Page } from '@playwright/test';

/** Text of the stub page that replaces the real signup response. */
export const INTERCEPTED_SIGNUP_TEXT = 'Signup request intercepted for test';

export function signupLocators(page: Page) {
  return {
    heading: page.getByRole('heading', { name: 'Create your account' }),
    emailInput: page.getByRole('textbox', { name: 'Email address' }),
    termsCheckbox: page.getByRole('checkbox', { name: /By checking this box/ }),
    // The label is drawn over the checkbox input and takes its clicks, so check() cannot reach it.
    termsLabel: page.locator('label[for="terms-of-service"]'),
    termsOfServiceLink: page.getByRole('link', { name: 'Terms of Service' }),
    privacyPolicyLink: page.getByRole('main').getByRole('link', { name: 'Privacy Policy' }),
    signUpButton: page.getByRole('button', { name: 'Sign up', exact: true }),
    errorMessage: (text: string) => page.getByText(text, { exact: true }),
    interceptedNotice: page.getByText(INTERCEPTED_SIGNUP_TEXT),
  };
}

export type SignupLocators = ReturnType<typeof signupLocators>;
