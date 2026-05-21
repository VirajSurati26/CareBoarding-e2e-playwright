import { Page } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {
    // Page is stored for use in methods
  }

  async goto(url: string) {
    await this.page.goto(url);
  }

  async waitForElement(selector: string, timeout: number = 5000) {
    await this.page.waitForSelector(selector, { timeout });
  }

  async clickElement(selector: string) {
    await this.page.click(selector);
  }

  async fillInput(selector: string, value: string) {
    await this.page.fill(selector, value);
  }

  async getText(selector: string) {
    return await this.page.textContent(selector);
  }

  async isVisible(selector: string) {
    return await this.page.isVisible(selector);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async takeScreenshot(fileName: string) {
    await this.page.screenshot({ path: `reports/screenshots/${fileName}.png` });
  }
}
