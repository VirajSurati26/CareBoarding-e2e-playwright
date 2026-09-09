import { Page } from '@playwright/test';

/**
 * Base Page Object Model class
 * Provides common Playwright interactions for all page objects
 */
export class BasePage {
  protected readonly DEFAULT_TIMEOUT = 5000;
  protected readonly DESKTOP_WIDTH = 1920;
  protected readonly DESKTOP_HEIGHT = 1080;
  protected readonly MOBILE_WIDTH = 320;
  protected readonly MOBILE_HEIGHT = 240;
  protected readonly TABLET_WIDTH = 1280;
  protected readonly TABLET_HEIGHT = 720;

  constructor(protected readonly page: Page) {}


  async goto(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }


  async waitForElement(selector: string, timeout = this.DEFAULT_TIMEOUT): Promise<void> {
    await this.page.waitForSelector(selector, { timeout, state: 'visible' });
  }


  async clickElement(selector: string): Promise<void> {
    try {
      await this.page.click(selector, { timeout: this.DEFAULT_TIMEOUT });
    } catch (error) {
      console.error(`Failed to click element: ${selector}`, error);
      throw error;
    }
  }


  async fillInput(selector: string, value: string): Promise<void> {
    try {
      await this.page.fill(selector, value, { timeout: this.DEFAULT_TIMEOUT });
    } catch (error) {
      console.error(`Failed to fill input: ${selector}`, error);
      throw error;
    }
  }


  async getText(selector: string): Promise<string | null> {
    try {
      return await this.page.textContent(selector);
    } catch (error) {
      console.warn(`Failed to get text from: ${selector}`, error);
      return null;
    }
  }


  async isVisible(selector: string): Promise<boolean> {
    try {
      return await this.page.isVisible(selector);
    } catch (error) {
      console.warn(`Failed to check visibility: ${selector}`, error);
      return false;
    }
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }


  async scrollUp(pixels: number): Promise<void> {
    await this.page.evaluate((value: number) => window.scrollBy(0, -value), pixels);
  }

  async scrollDown(pixels: number): Promise<void> {
    await this.page.evaluate((value: number) => window.scrollBy(0, value), pixels);
  }

 
  async scrollToTop(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, 0));
  }

  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }


  async takeScreenshot(fileName: string): Promise<void> {
    await this.page.screenshot({ path: `reports/screenshots/${fileName}.png`, fullPage: true });
  }

  
  async maximizeWindow(): Promise<void> {
    await this.page.setViewportSize({ width: this.DESKTOP_WIDTH, height: this.DESKTOP_HEIGHT });
  }


  async minimizeWindow(): Promise<void> {
    await this.page.setViewportSize({ width: this.MOBILE_WIDTH, height: this.MOBILE_HEIGHT });
  }

  
  async setWindowSize(width: number, height: number): Promise<void> {
    await this.page.setViewportSize({ width, height });
  }


  async centerWindow(): Promise<void> {
    await this.page.setViewportSize({ width: this.TABLET_WIDTH, height: this.TABLET_HEIGHT });
  }


  async setupTest(): Promise<void> {
    await this.maximizeWindow();
  }


  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }


  async reloadPage(): Promise<void> {
    await this.page.reload({ waitUntil: 'networkidle' });
  }

  async isElementPresent(selector: string): Promise<boolean> {
    const element = await this.page.$(selector);
    return element !== null;
  }

 
  async getAllTexts(selector: string): Promise<string[]> {
    try {
      return await this.page.locator(selector).allTextContents();
    } catch (error) {
      console.warn(`Failed to get all texts: ${selector}`, error);
      return [];
    }
  }

 
  async hoverElement(selector: string): Promise<void> {
    try {
      await this.page.locator(selector).hover();
    } catch (error) {
      console.error(`Failed to hover element: ${selector}`, error);
      throw error;
    }
  }

 
  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }


  async closePage(): Promise<void> {
    await this.page.close();
  }
}
