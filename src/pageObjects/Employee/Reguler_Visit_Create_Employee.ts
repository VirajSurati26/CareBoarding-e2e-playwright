import { Page } from '@playwright/test';
import { BasePage } from '@/pageObjects/BaseClass/BasePage';
import { ALL_LOCATORS } from '@/utils/UsingAllLocators';

export class Employee extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    async clickEmployeeButtonsideMenu(): Promise<void> {
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.loadingOverlay).waitFor({ state: 'hidden', timeout: 15000 }).catch(() => { });
        const link = this.page.locator(ALL_LOCATORS.EMPLOYEE.navLinkEmployees).filter({ hasText: 'Employees' }).first();
        await link.waitFor({ state: 'visible', timeout: 10000 });
        await link.click();
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.searchEmployeeBtn).waitFor({ state: 'visible', timeout: 15000 });
    }

    async clickSearchEmployeeButton(): Promise<void> {
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.searchEmployeeBtn).click();
    }

    async selectAndOpenEmployee(index: number): Promise<string> {
        const row = this.page.locator(ALL_LOCATORS.EMPLOYEE.employeeTableRow).nth(index);
        const name = await row.locator('td').nth(1).textContent();
        await row.locator('td').nth(1).locator('a').click();
        await this.page.waitForLoadState('networkidle', { timeout: 10000 });
        return name?.trim() || '';
    }

    async clickCalendarButton(): Promise<void> {
        const btn = this.page.locator(ALL_LOCATORS.EMPLOYEE.calendarBtn).first();
        await btn.waitFor({ state: 'visible', timeout: 10000 });
        await btn.click();
    }

    async selectCurrentDate(): Promise<void> {
        const day = new Date().getDate();
        const dayLocator = this.page.locator(ALL_LOCATORS.EMPLOYEE.calendarDay(day)).filter({ hasNot: this.page.locator('.d-none') }).first();
        await dayLocator.waitFor({ state: 'visible', timeout: 15000 });
        await dayLocator.click();
    }

    private generateRandomVisitSlot(): { startTime: string; endTime: string } {
        // Random hour between 6 AM and 8 PM
        const hour = Math.floor(Math.random() * 15) + 6;

        // Random minutes: 00, 15, 30, 45
        const minuteOptions = [0, 15, 30, 45];
        const minute = minuteOptions[Math.floor(Math.random() * minuteOptions.length)];

        const start = new Date();
        start.setHours(hour, minute, 0, 0);

        // Random duration between 30 and 120 mins
        const duration = (Math.floor(Math.random() * 4) + 1) * 30;

        const end = new Date(start.getTime() + duration * 60 * 1000);

        const startTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
        const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;

        return { startTime, endTime };
    }

    // Public method used by tests to obtain a visit time slot.
    // It first tries to generate a non‑overlapping slot using the existing logic.
    // If that fails (e.g., no free slot), it falls back to a random slot.
    async generateVisitAtRandomTime(): Promise<{ startTime: string; endTime: string }> {
        try {
            const slot = await this.generateNonOverlappingVisitTime();
            return slot;
        } catch (error) {
            console.log('Failed to get non‑overlapping slot, using random slot fallback.', error);
        }

        const { startTime, endTime } = this.generateRandomVisitSlot();
        await this.fillVisitTime(startTime, endTime);
        return { startTime, endTime };
    }

    async generateNonOverlappingVisitTime(): Promise<{ startTime: string; endTime: string }> {
        const start = new Date();
        start.setMinutes(start.getMinutes() + Math.floor(Math.random() * 16));

        const end = new Date(start.getTime() + 60 * 60 * 1000);

        const format = (d: Date) =>
            `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

        const startTime = format(start);
        const endTime = format(end);

        await this.fillVisitTime(startTime, endTime);

        return { startTime, endTime };
    }

    async fillVisitTime(startTime: string, endTime: string): Promise<void> {
        const inTimeInput = this.page.locator(ALL_LOCATORS.EMPLOYEE.inTimeInput);
        const outTimeInput = this.page.locator(ALL_LOCATORS.EMPLOYEE.outTimeInput);

        await inTimeInput.waitFor({ state: 'visible', timeout: 5000 });
        await outTimeInput.waitFor({ state: 'visible', timeout: 5000 });

        await inTimeInput.fill(startTime);
        await outTimeInput.fill(endTime);
    }

    async selectPatientByIndex(index: number, dropdownSelector?: string): Promise<string> {
        const selector = dropdownSelector || ALL_LOCATORS.EMPLOYEE.patientDropdown;
        const dropdown = this.page.locator(selector).first();
        await dropdown.waitFor({ state: 'visible', timeout: 10000 });
        await dropdown.click();
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).first().waitFor({ state: 'visible', timeout: 8000 });
        const patientName = await this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).nth(index).textContent();
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).nth(index).click();
        await this.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => { });
        return patientName?.trim() || '';
    }

    async selectPayRateByIndex(index: number): Promise<string> {
        const payRateDropdown = this.page.locator(ALL_LOCATORS.EMPLOYEE.payRateDropdown).first();
        await payRateDropdown.waitFor({ state: 'visible', timeout: 10000 });
        await payRateDropdown.click();
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).first().waitFor({ state: 'visible', timeout: 8000 });
        const payRate = await this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).nth(index).textContent() || '';
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).nth(index).click();
        return payRate.trim();
    }

    private async selectDropdownOption(dropdownLocator: any, textToSearch: string): Promise<string> {
        await dropdownLocator.waitFor({ state: 'visible', timeout: 10000 });
        await dropdownLocator.click();

        const searchField = this.page.locator('input.select2-search__field');
        await searchField.waitFor({ state: 'visible', timeout: 5000 });
        await searchField.focus();
        await searchField.pressSequentially(textToSearch, { delay: 50 });

        await this.page.waitForTimeout(1000);
        await this.page.locator('.select2-results__option:has-text("Searching")').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => { });

        const firstWord = textToSearch.split(' ')[0];
        const option = this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).filter({ hasText: firstWord }).first();
        await option.waitFor({ state: 'visible', timeout: 10000 });
        const selectedText = await option.textContent() || '';
        await option.click();
        return selectedText.trim();
    }

    async selectPOC(pocName: string): Promise<string> {
        return this.selectDropdownOption(this.page.locator(ALL_LOCATORS.EMPLOYEE.pocDropdown).first(), pocName);
    }

    async selectServiceCode(serviceCodeName: string): Promise<string> {
        return this.selectDropdownOption(this.page.locator(ALL_LOCATORS.EMPLOYEE.serviceCodeDropdown).first(), serviceCodeName);
    }

    async clickCreateButton(): Promise<void> {
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.createButton).click();
    }

    async clickOKButtonandPrintValidationMessage(): Promise<void> {
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.swalConfirm).click();
        const validationMessage = await this.page.locator(ALL_LOCATORS.EMPLOYEE.swalContainer).textContent();
    }
}
