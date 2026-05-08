import { Page, expect } from '@playwright/test';

//The Page is puased for debugging purposes

export async function pausePage(page: Page) {
    await page.pause();
}

// The page is scrolled to the bottom
export async function scrollToBottom(page: Page) {
    await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
    });
}

// The page is scrolled to the top
export async function scrollToTop(page: Page) {
    await page.evaluate(() => {
        window.scrollTo(0, 0);
    });
}

// Check checkbox
export async function checkCheckbox(page: Page, selector: string) {
    await page.check(selector);
}

// Uncheck checkbox
export async function uncheckCheckbox(page: Page, selector: string) {
    await page.uncheck(selector);
}

// Click checkbox (toggle)
export async function clickCheckbox(page: Page, selector: string) {
    await page.click(selector);
}

// Set checkbox state
export async function setCheckboxState(page: Page, selector: string, checked: boolean) {
    checked ? await page.check(selector) : await page.uncheck(selector);
}

// Check if checkbox is checked
export async function isCheckboxChecked(page: Page, selector: string): Promise<boolean> {
    return await page.isChecked(selector);
}

// Wait for checkbox to be visible and then check it
export async function waitForAndCheckCheckbox(page: Page, selector: string, timeout?: number) {
    await page.waitForSelector(selector, { state: 'visible', timeout });
    await page.check(selector);
}

// Generate random shift name
export function generateRandomShiftName(): string {
    const shiftTypes = ['Morning', 'Evening', 'Night', 'Day', 'Flex'];
    const shiftNumbers = Math.floor(Math.random() * 999) + 1;
    const shiftType = shiftTypes[Math.floor(Math.random() * shiftTypes.length)];
    return `${shiftType} Shift ${shiftNumbers}`;
}

// Select date in calendar
export async function selectCalendarDate(page: Page, dateInputSelector: string, targetDate: string): Promise<void> {
    // Simple direct input
    await page.locator(dateInputSelector).fill(targetDate);
    await page.keyboard.press('Tab');
}

// Convert AM/PM time to 24-hour format for HTML time input
export function convertAmPmTo24Hour(timeAmPm: string): string {
    const trimmed = timeAmPm.trim();
    const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    
    if (!match) {
        throw new Error(`Invalid time format: ${timeAmPm}. Expected format: HH:MM AM/PM`);
    }
    
    let [, hours, minutes, period] = match;
    period = period.toUpperCase();
    
    let hour24 = parseInt(hours);
    if (period === 'PM' && hour24 !== 12) {
        hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
        hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}`;
}

// Convert 24-hour time to AM/PM format
export function convert24HourToAmPm(time24: string): string {
    const match = time24.match(/^(\d{2}):(\d{2})$/);
    if (!match) {
        throw new Error(`Invalid 24-hour time format: ${time24}`);
    }
    
    let [, hours, minutes] = match;
    const hour24 = parseInt(hours);
    const period = hour24 >= 12 ? 'PM' : 'AM';
    let hour12 = hour24 % 12;
    if (hour12 === 0) hour12 = 12;
    
    return `${hour12}:${minutes} ${period}`;
}

// Validate AM/PM time format
export function isValidAmPmTime(time: string): boolean {
    const pattern = /^([1-9]|1[0-2]):([0-5][0-9])\s*(AM|PM)$/i;
    return pattern.test(time.trim());
}

// Generate random AM/PM time within business hours
export function generateRandomAmPmTime(): { amPm: string; time24: string } {
    const hour24 = Math.floor(Math.random() * 12) + 6; // 6 AM to 6 PM
    const minute = Math.floor(Math.random() * 60);
    const time24 = `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const amPm = convert24HourToAmPm(time24);
    
    return { amPm, time24 };
}

//Page reload
export async function pageReload(page: Page): Promise<void> {
    await page.reload()

  const refreshBtn = page.locator('button:has-text("Refresh")');
  const data = page.locator('#data');

  await refreshBtn.click();

  await expect(data).toBeVisible(); 

}

