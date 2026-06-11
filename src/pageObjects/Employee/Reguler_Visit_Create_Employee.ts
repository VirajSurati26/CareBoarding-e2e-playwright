import { Page } from '@playwright/test';
import { BasePage } from '@/pageObjects/BaseClass/BasePage';
import { ALL_LOCATORS } from '@/utils/UsingAllLocators';

export class Employee extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    async clickEmployeeButtonsideMenu(): Promise<void> {
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.loadingOverlay).waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
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

    async generateVisitAtRandomTime(): Promise<{ startTime: string, endTime: string }> {
        try {
            console.log("Checking calendar to find a non-overlapping time slot...");
            const timeSlot = await this.generateNonOverlappingVisitTime();
            console.log(`Generated non-overlapping time: ${timeSlot.startTime} - ${timeSlot.endTime}`);
            return timeSlot;
        } catch (error) {
            console.log("Failed to find non-overlapping time dynamically, falling back to random time offset...", error);
        }

        const now = new Date();
        const startTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 min from now
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

        const fmt = (d: Date) => `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        const start = fmt(startTime);
        const end = fmt(endTime);

        await this.fillVisitTime(start, end);
        return { startTime: start, endTime: end };
    }


    async generateNonOverlappingVisitTime(): Promise<{ startTime: string, endTime: string }> {
        const timeElements = await this.page.locator(ALL_LOCATORS.EMPLOYEE.calendarTimeCell).allTextContents();
        const scheduledHours = new Set<number>();

        for (const text of timeElements) {
            const match = text.match(/(\d{1,2}):(\d{2})/);
            if (match) {
                const hour = Number(match[1]);
                if (!Number.isNaN(hour)) scheduledHours.add(hour);
            }
        }

        let startHour = new Date(Date.now() + 15 * 60 * 1000).getHours();
        let attempts = 0;
        while (scheduledHours.has(startHour) && attempts < 24) {
            startHour = (startHour + 1) % 24;
            attempts++;
        }

        const startTime = `${startHour.toString().padStart(2, '0')}:00`;
        const endTime = `${((startHour + 1) % 24).toString().padStart(2, '0')}:00`;
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
        console.log(`Filled In/Out Time with start: ${startTime}, end: ${endTime}`);
    }

    async selectPatientByIndex(index: number, dropdownSelector?: string): Promise<string> {
        const selector = dropdownSelector || ALL_LOCATORS.EMPLOYEE.patientDropdown;
        const dropdown = this.page.locator(selector).first();
        await dropdown.waitFor({ state: 'visible', timeout: 10000 });
        await dropdown.click();
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).first().waitFor({ state: 'visible', timeout: 8000 });
        const patientName = await this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).nth(index).textContent();
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).nth(index).click();
        await this.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
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
        await this.page.locator('.select2-results__option:has-text("Searching")').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});

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
        console.log('Validation Message:', validationMessage);
    }
}
