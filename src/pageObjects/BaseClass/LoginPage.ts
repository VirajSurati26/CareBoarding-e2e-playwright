import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ALL_LOCATORS } from '@/utils/UsingAllLocators';

export class LoginPage extends BasePage {
  private readonly selectors = ALL_LOCATORS.LOGIN;


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
