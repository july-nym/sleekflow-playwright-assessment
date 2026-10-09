import { expect, type Page } from '@playwright/test';
import { entryPaths } from '../config/routes';
import { loginLocators, type LoginLocators } from '../locators/login.locators';

export class LoginPage {
  readonly locators: LoginLocators;

  constructor(private readonly page: Page) {
    this.locators = loginLocators(page);
  }

  async open() {
    await this.page.goto(entryPaths.login);
    await expect(this.locators.heading).toBeVisible();
  }

  async enterIdentifier(identifier: string) {
    await this.locators.identifierInput.fill(identifier);
  }

  async submitIdentifier() {
    await this.locators.continueButton.click();
  }

  async enterPassword(password: string) {
    await this.locators.passwordInput.fill(password);
  }

  async signIn() {
    await this.locators.signInButton.click();
  }

  /**
   * Opens the login form and continues with the identifier. Returns false when the SSO asks for a
   * CAPTCHA instead of showing the password step.
   */
  async goToPasswordStep(identifier: string): Promise<boolean> {
    await this.open();
    await this.enterIdentifier(identifier);
    await this.submitIdentifier();
    await expect(this.locators.passwordInput.or(this.locators.captchaInput)).toBeVisible();
    return this.locators.passwordInput.isVisible();
  }
}
