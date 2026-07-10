import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { LOGIN_SELECTORS } from '@/utils/UsingAllLocators';

/**
 * LoginPage - Handles login operations
 */
export class LoginPage extends BasePage {
  private readonly selectors = LOGIN_SELECTORS;

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to login page
   */
  async navigate(): Promise<void> {
    await this.goto('/login');
  }

  /**
   * Perform login with username and password
   */
  async login(username: string, password: string): Promise<void> {
    try {
      await this.waitForElement(this.selectors.usernameInput);
      await this.fillInput(this.selectors.usernameInput, username);
      await this.fillInput(this.selectors.passwordInput, password);
      await this.clickElement(this.selectors.loginButton);
      await this.waitForPageLoad();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Get error message from login form
   */
  async getErrorMessage(): Promise<string | null> {
    return await this.getText(this.selectors.errorMessage);
  }

  /**
   * Check if login form is visible
   */
  async isLoginFormVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.loginForm);
  }
}
