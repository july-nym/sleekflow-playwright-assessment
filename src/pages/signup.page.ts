import { expect, type Page } from '@playwright/test';
import { entryPaths } from '../config/routes';
import {
  INTERCEPTED_SIGNUP_TEXT,
  signupLocators,
  type SignupLocators,
} from '../locators/signup.locators';

export class SignupPage {
  readonly locators: SignupLocators;
  private typedEmail?: string;
  private capturedForm?: URLSearchParams;

  constructor(private readonly page: Page) {
    this.locators = signupLocators(page);
  }

  /** Form data of the intercepted signup request, available after the form is submitted. */
  get interceptedForm(): URLSearchParams | undefined {
    return this.capturedForm;
  }

  async open() {
    await this.page.goto(entryPaths.signup);
    await expect(this.locators.heading).toBeVisible();
  }

  async enterEmail(email: string) {
    this.typedEmail = email;
    await this.locators.emailInput.fill(email);
  }

  async acceptTerms() {
    await this.locators.termsLabel.click({ position: { x: 40, y: 10 } });
    await expect(this.locators.termsCheckbox).toBeChecked();
  }

  async submit() {
    await this.locators.signUpButton.click();
  }

  /**
   * Keeps every POST in the browser. The request that carries the typed email gets a stub page
   * and its form data is kept for the assertions. Any other POST is aborted.
   */
  async interceptSubmission() {
    await this.page.route('**/*', async (route) => {
      const request = route.request();
      if (request.method() !== 'POST') return route.continue();

      const form = new URLSearchParams(request.postData() ?? '');
      if (!this.typedEmail || form.get('email') !== this.typedEmail) return route.abort();

      this.capturedForm = form;
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `<main>${INTERCEPTED_SIGNUP_TEXT}</main>`,
      });
    });
  }
}
