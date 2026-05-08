import { Page, Expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class Employee extends BasePage {
    constructor(page: Page) {
        super(page);
    }


// Perform the Click the "Employee" button
async clickEmployeeButtonsideMenu() {
    // Wait for loading overlay to disappear
    await this.page.locator('.loading-overlay.is-active').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    
    // Wait for Employees link to be clickable
    await this.page.locator('a.nav-link').filter({ hasText: 'Employees' }).first().waitFor({ state: 'visible', timeout: 10000 });
    await this.page.locator('a.nav-link').filter({ hasText: 'Employees' }).first().click();
    
    // Wait for any loading after click
    await this.page.waitForTimeout(2000);
}

// Perform the Click the "Search Employee" button in Employee Dropdown
async clickSearchEmployeeButton() {
    await this.page.locator('text=Search Employee').click();
}

// Perform the select the Employee and select the open employee
async selectAndOpenEmployee(index: number): Promise<string> {
    const employeeRow = this.page.locator('table tbody tr').nth(index);
    const employeeName = await employeeRow.locator('td').nth(1).textContent();
    await employeeRow.locator('td').nth(1).locator('a').click();
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    return employeeName?.trim() || '';

}

// Perform the Click the "Calendar" button in Employee view page
async clickCalendarButton() {
    await this.page.waitForTimeout(2000);
    await this.page.locator('text=Calendar').first().click();
}

async selectCurrentDate() {
    await this.page.waitForTimeout(2000);
    const day = new Date().getDate();
    await this.page.locator(`text="${day}"`).first().click();
}

// Generate a visit at a random time
async generateVisitAtRandomTime() {
    await this.page.waitForTimeout(1000);
    const hours = Math.floor(Math.random() * 14) + 6;
    const minutes = Math.floor(Math.random() * 60);
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    // Try to find and click a button or label to show time input
    try {
        await this.page.locator('text=Add Visit').first().click();
    } catch (error) {
        try {
            await this.page.locator('text=Visit').first().click();
        } catch (error2) {
            // Continue
        }
    }
    
    await this.page.waitForTimeout(1000);
    await this.page.locator('input[type="time"]').first().fill(timeStr);
} 

}