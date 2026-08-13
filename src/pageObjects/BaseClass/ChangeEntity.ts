import { Page } from '@playwright/test';
import { ALL_LOCATORS } from '@/utils/UsingAllLocators';

export class ChangeEntity {
    constructor(private page: Page) { }

    async selectEntity(entityName: string): Promise<void> {
        // Open dropdown
        await this.page.click(ALL_LOCATORS.CHANGE_ENTITY.entityDropdown);

        // Type in search field to filter options if visible
        const searchInput = this.page.locator(ALL_LOCATORS.CHANGE_ENTITY.searchField);
        if (await searchInput.isVisible().catch(() => false)) {
            await searchInput.fill(entityName);
        }

        // Click matching option dynamically (by role or text)
        const option = this.page
            .getByRole('option', { name: entityName })
            .or(this.page.locator(ALL_LOCATORS.CHANGE_ENTITY.entityOptions).filter({ hasText: entityName }))
            .first();

        await option.click();
    }

    async getCurrentEntity(): Promise<string> {
        const text = await this.page.locator(ALL_LOCATORS.CHANGE_ENTITY.entityDropdown).textContent();
        return text?.trim() || '';
    }

    async getAvailableEntities(): Promise<string[]> {
        await this.page.click(ALL_LOCATORS.CHANGE_ENTITY.entityDropdown);
        await this.page.waitForSelector(ALL_LOCATORS.CHANGE_ENTITY.entityOptions, { state: 'visible' });

        const entities = await this.page.locator(ALL_LOCATORS.CHANGE_ENTITY.entityOptions).allTextContents();
        await this.page.keyboard.press('Escape');
        return entities.map(e => e.trim()).filter(Boolean);
    }

    // Select "Are you sure?" pop up Confirm button
    async selectAreYouSureConfirmButton(): Promise<void> {
        const confirmButton = this.page.getByRole('button', { name: 'Yes, Change Entity' })
            .or(this.page.locator('button.swal2-confirm'))
            .first();
        await confirmButton.waitFor({ state: 'visible' });
        await confirmButton.click();
    }

}   
