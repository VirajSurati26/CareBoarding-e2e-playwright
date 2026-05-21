import { Page } from '@playwright/test';
import { ALL_LOCATORS } from '@/utils/UsingAllLocators';

export class ChangeEntity {
  constructor(private page: Page) {}

  async selectEntity(entityName: string): Promise<void> {
    // Click on the specific entity Select2 dropdown
    await this.page.click(ALL_LOCATORS.CHANGE_ENTITY.entityDropdown);
    await this.page.waitForSelector(ALL_LOCATORS.CHANGE_ENTITY.entityOptions, { state: 'visible', timeout: 10000 });
    
    // Click on the specific option
    await this.page.click(`${ALL_LOCATORS.CHANGE_ENTITY.entityOptions}:has-text("${entityName}")`);
    await this.page.waitForFunction(
      (selector, expected) => document.querySelector(selector)?.textContent?.includes(expected),
      ALL_LOCATORS.CHANGE_ENTITY.entityDropdown,
      entityName,
      { timeout: 10000 }
    );
    
    const confirmButton = this.page.locator(ALL_LOCATORS.CHANGE_ENTITY.confirmationButton);
    if (await confirmButton.count() > 0 && await confirmButton.isVisible()) {
      try {
        await confirmButton.click({ timeout: 3000 });
      } catch (error) {
        console.error('Failed to click ChangeEntity confirmation button:', error);
        throw error;
      }
    }
  }

  async getCurrentEntity(): Promise<string> {
    const text = await this.page.locator(ALL_LOCATORS.CHANGE_ENTITY.entityDropdown).textContent();
    return text?.trim() || '';
  }

  async getAvailableEntities(): Promise<string[]> {
    // Click on the specific entity Select2 dropdown
    await this.page.click(ALL_LOCATORS.CHANGE_ENTITY.entityDropdown);
    await this.page.waitForSelector(ALL_LOCATORS.CHANGE_ENTITY.entityOptions, { state: 'visible', timeout: 10000 });
    
    // Wait for options to be visible
    const entities = await this.page.locator(ALL_LOCATORS.CHANGE_ENTITY.entityOptions).allTextContents();
    await this.page.keyboard.press('Escape'); 
    return entities.filter(e => e.trim());
  }
}


