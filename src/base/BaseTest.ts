import { test, Page, expect } from '@playwright/test';

export class BaseTest {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Maximize browser window to standard size
   */
  async maximizeWindow(): Promise<void> {
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    await this.page.evaluate(`() => {
      window.moveTo(0, 0);
      window.resizeTo(Math.min(screen.width, 1920), Math.min(screen.height, 1080));
    }`);
  }

  /**
   * Minimize browser window (simulate)
   */
  async minimizeWindow(): Promise<void> {
    await this.page.evaluate(`() => {
      window.resizeTo(320, 240);
      window.moveTo(screen.width - 320, screen.height - 240);
    }`);
  }

  /**
   * Set window size
   */
  async setWindowSize(width: number, height: number): Promise<void> {
    await this.page.setViewportSize({ width, height });
  }

  /**
   * Center window on screen
   */
  async centerWindow(): Promise<void> {
    await this.page.evaluate(`() => {
      const width = 1280;
      const height = 720;
      const x = (screen.width - width) / 2;
      const y = (screen.height - height) / 2;
      window.moveTo(x, y);
      window.resizeTo(width, height);
    }`);
  }

  /**
   * Common setup for tests
   */
  async setupTest(): Promise<void> {
    await this.maximizeWindow();
  }

  /**
   * Wait for network idle
   */
  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Take screenshot on failure
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }
}

// Extend the test fixture
export const baseTest = test.extend<{ baseTest: BaseTest }>({
  baseTest: async ({ page }, use) => {
    const baseTestInstance = new BaseTest(page);
    await use(baseTestInstance);
  }
});
