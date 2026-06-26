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
  /**
   * Scroll up by given number of pixels.
   */
  async scrollUp(pixels: number): Promise<void> {
    await this.page.evaluate((p) => window.scrollBy(0, -p), pixels);
  }

  async takeScreenshot(fileName: string) {
    await this.page.screenshot({ path: `reports/screenshots/${fileName}.png` });
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
  
    // Duplicate takeScreenshot method removed to avoid overload conflict
  
  // Extend the test fixture
}
