import { Page, Expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { ALL_LOCATORS } from '../utils/UsingAllLocators';

export class Employee extends BasePage {
    constructor(page: Page) {
        super(page);
    }


    // Perform the Click the "Employee" button
    async clickEmployeeButtonsideMenu() {
        // Wait for loading overlay to disappear
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.loadingOverlay).waitFor({ state: 'hidden', timeout: 15000 }).catch(() => { });

        // Wait for Employees link to be clickable
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.navLinkEmployees).filter({ hasText: 'Employees' }).first().waitFor({ state: 'visible', timeout: 10000 });
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.navLinkEmployees).filter({ hasText: 'Employees' }).first().click();

        // Wait for any loading after click
        await this.page.waitForTimeout(2000);
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
        await this.page.waitForTimeout(2000);
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.calendarBtn).first().click();
    }

    async selectCurrentDate() {
        await this.page.waitForTimeout(2000);
        const day = new Date().getDate();
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.calendarDay(day)).first().click();
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
        // Read calendar page body to scan for scheduled times
        const cellText = await this.page.textContent('body') || "";

        // Start scanning from the hour that is 15 minutes from now
        let startHour = new Date(Date.now() + 15 * 60 * 1000).getHours();
        let attempts = 0;

        // Keep incrementing to next hour if it's already scheduled on calendar text
        while (cellText.includes(`${startHour.toString().padStart(2, '0')}:`) && attempts < 24) {
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
        await this.page.waitForTimeout(2000);
        const selector = dropdownSelector || ALL_LOCATORS.EMPLOYEE.patientDropdown;
        await this.page.locator(selector).first().click();
        await this.page.waitForTimeout(1000);
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).first().waitFor({ state: 'visible', timeout: 8000 });
        // Get the patient name before clicking
        const patientName = await this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).nth(index).textContent();
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).nth(index).click();
        return patientName?.trim() || '';
    }

    //----------------Perform the Pay Rate the Dropdown button----------------------

    async selectPayRateByIndex(index: number): Promise<string> {
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.payRateDropdown).first().click();
        const payRate = await this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).nth(index).textContent() || '';
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).nth(index).click();
        return payRate;
    }

    //-------------Perform the POC Select the Dropdown button----------------------

    async selectPOCByIndex(index: number): Promise<string> {
        await this.page.waitForTimeout(2000);
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.pocDropdown).first().click();
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).first().waitFor({ state: 'visible', timeout: 8000 });
        const poc = await this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).nth(index).textContent() || '';
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).nth(index).click();
        await this.page.waitForTimeout(2000);
        return poc;
    }

    //-------------Perform the Service Code Select the in Dropdown button----------------------

    async selectServiceCodeByIndex(index: number): Promise<string> {

        await this.page.locator(ALL_LOCATORS.EMPLOYEE.serviceCodeDropdown).first().click();
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).first().waitFor({ state: 'visible', timeout: 8000 });
        const serviceCode = await this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).nth(index).textContent() || ''
        await this.page.locator(ALL_LOCATORS.EMPLOYEE.select2ResultsOption).nth(index).click();
        await this.page.waitForTimeout(2000);
        return serviceCode;
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
