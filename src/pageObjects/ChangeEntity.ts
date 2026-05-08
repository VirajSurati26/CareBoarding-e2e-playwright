import { Page } from '@playwright/test';

export class ChangeEntity {
  constructor(private page: Page) {}

  async selectEntity(entityName: string): Promise<void> {
    // Click on the specific entity Select2 dropdown
    await this.page.click('#select2-entity-container');
    await this.page.waitForTimeout(1000);
    
    // Wait for dropdown to be visible
    await this.page.waitForSelector('.select2-results__option', { state: 'visible' });
    
    // Click on the specific option
    await this.page.click(`.select2-results__option:has-text("${entityName}")`);
    await this.page.waitForTimeout(2000);
    
    try {
      await this.page.click('button:has-text("Yes, Change Entity")', { timeout: 3000 });
    } catch {
      // No confirmation needed
    }
  }

  async getCurrentEntity(): Promise<string> {
    const text = await this.page.locator('#select2-entity-container').textContent();
    return text?.trim() || '';
  }

  async getAvailableEntities(): Promise<string[]> {
    // Click on the specific entity Select2 dropdown
    await this.page.click('#select2-entity-container');
    await this.page.waitForTimeout(1000);
    
    // Wait for options to be visible
    await this.page.waitForSelector('.select2-results__option', { state: 'visible' });
    const entities = await this.page.locator('.select2-results__option').allTextContents();
    await this.page.keyboard.press('Escape'); 
    return entities.filter(e => e.trim());
  }
}


