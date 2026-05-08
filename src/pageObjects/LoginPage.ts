import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  private readonly selectors = {
    usernameInput: 'input[type="email"], input[name="username"], input[id="email"], input[name="email"]',
    passwordInput: 'input[type="password"], input[name="password"]',
    loginButton: 'button[type="submit"], button:has-text("Login"), button:has-text("Sign In"), input[type="submit"]',
    errorMessage: '.error-message, .alert-danger, [role="alert"], .notification-error',
    loginForm: 'form, .login-form, #login-form',
  };

  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.goto('/login');
  }

  async login(username: string, password: string) {
    await this.waitForElement(this.selectors.usernameInput);
    await this.fillInput(this.selectors.usernameInput, username);
    await this.fillInput(this.selectors.passwordInput, password);
    await this.clickElement(this.selectors.loginButton);
  }

  async getErrorMessage() {
    return await this.getText(this.selectors.errorMessage);
  }

  async isLoginFormVisible() {
    return await this.isVisible(this.selectors.loginForm);
  
  }
}
