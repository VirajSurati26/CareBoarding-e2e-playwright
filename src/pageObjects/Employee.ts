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

//=============Sucessfully Create the visit in pop-up message====================

//--------------Generate a visit at a random time----------------------

 async generateVisitAtRandomTime(): Promise<void> {

  // Wait for page to stabilize after date selection
  await this.page.waitForTimeout(2000);
  
  const startHour = Math.floor(Math.random() * 10) + 1;
  const endHour = startHour + Math.floor(Math.random() * 4) + 1;
  const start = `${startHour.toString().padStart(2, '0')}:00`;
  const end = `${endHour.toString().padStart(2, '0')}:00`;
    
  // Fill the time input fields using specific name selectors for Schedule Information
  const inTimeInput = this.page.locator('input[name="in_time"]');
  const outTimeInput = this.page.locator('input[name="out_time"]');
  
  // Wait for the specific time fields to be visible
  await inTimeInput.waitFor({ state: 'visible', timeout: 5000 });
  await outTimeInput.waitFor({ state: 'visible', timeout: 5000 });
  
  // Fill the time fields
  await inTimeInput.fill(start);
  await outTimeInput.fill(end);
  
  console.log(`Filled In/Out Time with start: ${start}, end: ${end}`);
}

//------------Perform the Patients Select the Dropdown button----------------------

// Patient dropdown selection by index
async selectPatientByIndex(index: number, dropdownSelector?: string): Promise<string> {
    await this.page.waitForTimeout(2000);
    const selector = dropdownSelector || '#select2-patientIdVal-container';
    await this.page.locator(selector).first().click();
    await this.page.waitForTimeout(1000);
    await this.page.locator('.select2-results__option').first().waitFor({ state: 'visible', timeout: 8000 });  
    // Get the patient name before clicking
    const patientName = await this.page.locator('.select2-results__option').nth(index).textContent();
    await this.page.locator('.select2-results__option').nth(index).click();   
    return patientName?.trim() || '';
}

//----------------Perform the Pay Rate the Dropdown button----------------------

async selectPayRateByIndex(index: number): Promise<string> {
    await this.page.locator('span[id*="select2-pay_rate"]').first().click();
    const payRate = await this.page.locator('.select2-results__option').nth(index).textContent() || '';
    await this.page.locator('.select2-results__option').nth(index).click();
    return payRate;
}

//-------------Perform the POC Select the Dropdown button----------------------

async selectPOCByIndex(index: number): Promise<string> {
    await this.page.waitForTimeout(2000);
    await this.page.locator('span[id*="select2-poc"]').first().click();
    await this.page.locator('.select2-results__option').first().waitFor({ state: 'visible', timeout: 8000 });
    const poc = await this.page.locator('.select2-results__option').nth(index).textContent() || '';
    await this.page.locator('.select2-results__option').nth(index).click();
    await this.page.waitForTimeout(2000);
    return poc;
}

//-------------Perform the Service Code Select the in Dropdown button----------------------

async selectServiceCodeByIndex(index: number): Promise<string> {
   
    await this.page.locator('span[id*="select2-service_code"]').first().click();
    await this.page.locator('.select2-results__option').first().waitFor({ state: 'visible', timeout: 8000 });
    const serviceCode = await this.page.locator('.select2-results__option').nth(index).textContent() || ''
    await this.page.locator('.select2-results__option').nth(index).click();
    await this.page.waitForTimeout(2000);
    return serviceCode;
}

//---------------Perform the Create button Apply----------------------

async clickCreateButton() {
    await this.page.locator('#changeStatusFormSubBtn').click();
}

//---------------Perorm the "OK" button and Print the validation message ----------------------

async clickOKButtonandPrintValidationMessage() {
    await this.page.locator('.swal2-confirm').click();
    const validationMessage = await this.page.locator('.swal2-html-container').textContent();
    console.log('Validation Message:', validationMessage);
}
             
}
