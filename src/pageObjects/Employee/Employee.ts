import { Page, Expect } from '@playwright/test';
import { BasePage } from '@/pageObjects/BaseClass/BasePage';
import { ALL_LOCATORS } from '@/utils/UsingAllLocators';

export class Employee extends BasePage {
    constructor(page: Page) {
        super(page);
    }


    // Perform the Click the "Employee" button
    async clickEmployeeButtonsideMenu() {
        // Wait for loading overlay to disappear
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.loadingOverlay).waitFor({ state: 'hidden', timeout: 15000 }).catch(() => { });

        // Wait for Employees link to be clickable
        const employeeLink = this.page.locator(ALL_LOCATORS.EMPLOYEE.navLinkEmployees).filter({ hasText: 'Employees' }).first();
        await employeeLink.waitFor({ state: 'visible', timeout: 10000 });
        await employeeLink.click();

        await this.page.locator(ALL_LOCATORS.EMPLOYEE.searchEmployeeBtn).waitFor({ state: 'visible', timeout: 15000 });
    }

    // Perform the Click the "Search Employee" button in Employee Dropdown
    async clickSearchEmployeeButton() {
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.searchEmployeeBtn).click();
    }

    // Perform the select the Employee and select the open employee
    async selectAndOpenEmployee(index: number): Promise<string> {
        const employeeRow = this.page.locator(ALL_LOCATORS.EMPLOYEE.employeeTableRow).nth(index);
        const employeeName = await employeeRow.locator('td').nth(1).textContent();
        await employeeRow.locator('td').nth(1).locator('a').click();
        await this.page.waitForLoadState('networkidle', { timeout: 10000 });
        return employeeName?.trim() || '';

    }

    // Perform the Click the "Calendar" button in Employee view page
    async clickCalendarButton() {
        const calendarBtn = this.page.locator(ALL_LOCATORS.EMPLOYEE.calendarBtn).first();
        await calendarBtn.waitFor({ state: 'visible', timeout: 10000 });
        await calendarBtn.click();
    }

    async selectCurrentDate() {
        const day = new Date().getDate();
        const dayLocator = this.page.locator(ALL_LOCATORS.EMPLOYEE.calendarDay(day)).filter({ hasNot: this.page.locator('.d-none') }).first();
        await dayLocator.waitFor({ state: 'visible', timeout: 15000 });
        await dayLocator.click();
    }

    //=============Sucessfully Create the visit in pop-up message====================

    //--------------Generate a visit at a random time----------------------

    async generateVisitAtRandomTime(): Promise<{ startTime: string, endTime: string }> {
        const now = new Date();
        const startTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now
        const durationHours = 1; // Duration is exactly 1 hour
        const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

        const start = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
        const end = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;

        // Fill the time input fields using specific name selectors for Schedule Information
        const inTimeInput = this.page.locator(ALL_LOCATORS.EMPLOYEE.inTimeInput);
        const outTimeInput = this.page.locator(ALL_LOCATORS.EMPLOYEE.outTimeInput);

        // Wait for the specific time fields to be visible
        await inTimeInput.waitFor({ state: 'visible', timeout: 5000 });
        await outTimeInput.waitFor({ state: 'visible', timeout: 5000 });

        // Fill the time fields
        await inTimeInput.fill(start);
        await outTimeInput.fill(end);

        console.log(`Filled In/Out Time with start: ${start}, end: ${end}`);
        return { startTime: start, endTime: end };
    }

    async generateNonOverlappingVisitTime(): Promise<{ startTime: string, endTime: string }> {
        const timeElements = await this.page.locator(ALL_LOCATORS.EMPLOYEE.calendarTimeCell).allTextContents();
        const scheduledHours = new Set<number>();

        for (const text of timeElements) {
            const match = text.match(/(\d{1,2}):(\d{2})/);
            if (match) {
                const hour = Number(match[1]);
                if (!Number.isNaN(hour)) {
                    scheduledHours.add(hour);
                }
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


    //------------Perform the Patients Select the Dropdown button----------------------

    // Patient dropdown selection by index
    async selectPatientByIndex(index: number, dropdownSelector?: string): Promise<string> {
        const selector = dropdownSelector || ALL_LOCATORS.EMPLOYEE.patientDropdown;
        const dropdown = this.page.locator(selector).first();
        await dropdown.waitFor({ state: 'visible', timeout: 10000 });
        await dropdown.click();
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).first().waitFor({ state: 'visible', timeout: 8000 });
        const patientName = await this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).nth(index).textContent();
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).nth(index).click();
        
        // Wait for background AJAX requests (loading POC & Service Codes for the selected patient) to complete
        await this.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
        
        return patientName?.trim() || '';
    }

    //----------------Perform the Pay Rate the Dropdown button----------------------

    async selectPayRateByIndex(index: number): Promise<string> {
        const payRateDropdown = this.page.locator(ALL_LOCATORS.EMPLOYEE.payRateDropdown).first();
        await payRateDropdown.waitFor({ state: 'visible', timeout: 10000 });
        await payRateDropdown.click();
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).first().waitFor({ state: 'visible', timeout: 8000 });
        const payRate = await this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).nth(index).textContent() || '';
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).nth(index).click();
        return payRate;
    }

    //-------------Perform the POC Select the Dropdown button----------------------

    async selectPOC(pocName: string): Promise<string> {
        const pocDropdown = this.page.locator(ALL_LOCATORS.EMPLOYEE.pocDropdown).first();
        await pocDropdown.waitFor({ state: 'visible', timeout: 10000 });
        await pocDropdown.click();
        
        const searchField = this.page.locator('input.select2-search__field');
        await searchField.waitFor({ state: 'visible', timeout: 5000 });
        await searchField.focus();
        await searchField.pressSequentially(pocName, { delay: 50 });
        
        // Wait for Select2 to start searching and then finish searching
        await this.page.waitForTimeout(1000);
        await this.page.locator('.select2-results__option:has-text("Searching")').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
        
        const firstWord = pocName.split(' ')[0];
        const option = this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).filter({ hasText: firstWord }).first();
        await option.waitFor({ state: 'visible', timeout: 10000 });
        const selectedText = await option.textContent() || '';
        await option.click();
        return selectedText.trim();
    }

    //-------------Perform the Service Code Select the in Dropdown button----------------------

    async selectServiceCode(serviceCodeName: string): Promise<string> {
        const serviceCodeDropdown = this.page.locator(ALL_LOCATORS.EMPLOYEE.serviceCodeDropdown).first();
        await serviceCodeDropdown.waitFor({ state: 'visible', timeout: 10000 });
        await serviceCodeDropdown.click();
        
        const searchField = this.page.locator('input.select2-search__field');
        await searchField.waitFor({ state: 'visible', timeout: 5000 });
        await searchField.focus();
        await searchField.pressSequentially(serviceCodeName, { delay: 50 });
        
        // Wait for Select2 to start searching and then finish searching
        await this.page.waitForTimeout(1000);
        await this.page.locator('.select2-results__option:has-text("Searching")').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
        
        const firstWord = serviceCodeName.split(' ')[0];
        const option = this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).filter({ hasText: firstWord }).first();
        await option.waitFor({ state: 'visible', timeout: 10000 });
        const selectedText = await option.textContent() || '';
        await option.click();
        return selectedText.trim();
    }

    //---------------Perform the Create button Apply----------------------

    async clickCreateButton() {
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.createButton).click();
    }

    //---------------Perorm the "OK" button and Print the validation message ----------------------

    async clickOKButtonandPrintValidationMessage() {
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.swalConfirm).click();
        const validationMessage = await this.page.locator(ALL_LOCATORS.EMPLOYEE.swalContainer).textContent();
        console.log('Validation Message:', validationMessage);
    }

}
