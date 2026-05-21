import { Page } from '@playwright/test';
import { ALL_LOCATORS } from '@/utils/UsingAllLocators';

export class ChangeEntity {
  constructor(private page: Page) {}

  async selectEntity(entityName: string): Promise<void> {
    // Click on the specific entity Select2 dropdown
    await this.page.click(ALL_LOCATORS.CHANGE_ENTITY.entityDropdown);
    await this.page.waitForTimeout(1000);
    
    // Wait for dropdown to be visible
    await this.page.waitForSelector(ALL_LOCATORS.CHANGE_ENTITY.entityOptions, { state: 'visible' });
    
    // Click on the specific option
    await this.page.click(`${ALL_LOCATORS.CHANGE_ENTITY.entityOptions}:has-text("${entityName}")`);
    await this.page.waitForTimeout(2000);
    
    try {
      await this.page.click(ALL_LOCATORS.CHANGE_ENTITY.confirmationButton, { timeout: 3000 });
    } catch {
      // No confirmation needed
    }
  }

  async getCurrentEntity(): Promise<string> {
    const text = await this.page.locator(ALL_LOCATORS.CHANGE_ENTITY.entityDropdown).textContent();
    return text?.trim() || '';
  }

  async getAvailableEntities(): Promise<string[]> {
    // Click on the specific entity Select2 dropdown
    await this.page.click(ALL_LOCATORS.CHANGE_ENTITY.entityDropdown);
    await this.page.waitForTimeout(1000);
    
    // Wait for options to be visible
    await this.page.waitForSelector(ALL_LOCATORS.CHANGE_ENTITY.entityOptions, { state: 'visible' });
    const entities = await this.page.locator(ALL_LOCATORS.CHANGE_ENTITY.entityOptions).allTextContents();
    await this.page.keyboard.press('Escape'); 
    return entities.filter(e => e.trim());
  }
}


