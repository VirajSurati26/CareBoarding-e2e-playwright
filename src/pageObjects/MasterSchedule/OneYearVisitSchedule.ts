import { Page } from '@playwright/test';
import { ALL_LOCATORS } from '@/utils/UsingAllLocators';
import { generateRandomShiftName, selectCalendarDate } from '@/utils/ReusableMethod';

export interface OneYearRecurringScheduleOptions {
  username: string;
  password: string;
  patientSearchText?: string;
  shiftName?: string;
  fromDate?: Date;
  toDate?: Date;
  employeeSearchText?: string;
  payRateSearchText?: string;
  pocSearchText?: string;
  serviceCodeSearchText?: string;
}

export class OneYearVisitSchedule {
  constructor(private page: Page) {}

  private formatDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  }

  private getRandomOneHourTime(): { start: string; end: string } {
    const startHour = Math.floor(Math.random() * 9) + 7; // 07:00 to 15:00
    const start = `${String(startHour).padStart(2, '0')}:00`;
    const end = `${String(startHour + 1).padStart(2, '0')}:00`;
    return { start, end };
  }

  private async waitForVisible(selector: string, timeout = 10000): Promise<void> {
    await this.page.locator(selector).first().waitFor({ state: 'visible', timeout });
  }

  private async clickFirstDropdownOption(dropdownSelector: string): Promise<void> {
    await this.page.locator(dropdownSelector).click();
    await this.waitForVisible(ALL_LOCATORS.MASTER_SCHEDULE.patientSearchInput);
    const firstOption = this.page.locator(ALL_LOCATORS.MASTER_SCHEDULE.patientSearchResult).first();
    await firstOption.waitFor({ state: 'visible', timeout: 10000 });
    await firstOption.click();
  }

  async login(username: string, password: string): Promise<void> {
    await this.page.goto('/login');
    await this.waitForVisible(ALL_LOCATORS.LOGIN.usernameInput);
    await this.page.fill(ALL_LOCATORS.LOGIN.usernameInput, username);
    await this.page.fill(ALL_LOCATORS.LOGIN.passwordInput, password);
    await this.page.click(ALL_LOCATORS.LOGIN.loginButton);
    await this.page.waitForLoadState('networkidle');
  }

  async openPatientsRecurringSchedule(): Promise<void> {
    await this.page.click(ALL_LOCATORS.MASTER_SCHEDULE.patientName('Patients'));
    await this.page.click(ALL_LOCATORS.MASTER_SCHEDULE.recurringScheduleMenu);
    await this.page.waitForLoadState('networkidle');
  }

  async selectFirstPatient(patientSearchText = 'Smith, John M. (TWI-000004)'): Promise<void> {
    await this.page.locator(ALL_LOCATORS.MASTER_SCHEDULE.selectPatientSpan).click();
    await this.waitForVisible(ALL_LOCATORS.MASTER_SCHEDULE.patientSearchInput);
    await this.page.fill(ALL_LOCATORS.MASTER_SCHEDULE.patientSearchInput, patientSearchText);
    const firstResult = this.page.locator(ALL_LOCATORS.MASTER_SCHEDULE.patientSearchResult).first();
    await firstResult.waitFor({ state: 'visible', timeout: 10000 });
    await firstResult.click();
    await this.page.click(ALL_LOCATORS.MASTER_SCHEDULE.searchButton);
    await this.page.waitForLoadState('networkidle');
  }

  async addRecurringSchedule(): Promise<void> {
    await this.page.click(ALL_LOCATORS.MASTER_SCHEDULE.addRecurringScheduleButton);
    await this.page.waitForLoadState('networkidle');
  }

  async selectRecurringPeriodMonthly(): Promise<void> {
    await this.page.click(ALL_LOCATORS.MASTER_SCHEDULE.monthlyOption);
  }

  async setShiftName(shiftName?: string): Promise<string> {
    const name = shiftName ?? generateRandomShiftName();
    await this.page.fill(ALL_LOCATORS.MASTER_SCHEDULE.shiftNameInput, name);
    return name;
  }

  async setFromToDate(fromDate: Date, toDate: Date): Promise<void> {
    const fromDateString = this.formatDate(fromDate);
    await selectCalendarDate(this.page, ALL_LOCATORS.MASTER_SCHEDULE.startDateInput, fromDateString);

    const toDateLocator = this.page.locator('input[name="to_date"], input[name="end_date"]');
    if (await toDateLocator.count() > 0) {
      await toDateLocator.first().fill(this.formatDate(toDate));
    } else {
      const dateInputs = this.page.locator('input[type="date"]');
      if (await dateInputs.count() > 1) {
        await dateInputs.nth(1).fill(this.formatDate(toDate));
      } else {
        // Fallback: if the form only exposes a single date field, use the same field first and rely on the UI to select range
        await selectCalendarDate(this.page, ALL_LOCATORS.MASTER_SCHEDULE.startDateInput, fromDateString);
      }
    }
  }

  async setOneHourSchedule(): Promise<{ start: string; end: string }> {
    const { start, end } = this.getRandomOneHourTime();
    const timeInputs = this.page.locator(ALL_LOCATORS.MASTER_SCHEDULE.timeInputs);
    await timeInputs.first().fill(start);
    await timeInputs.nth(1).fill(end);
    return { start, end };
  }

  async selectFirstEmployee(): Promise<void> {
    await this.clickFirstDropdownOption(ALL_LOCATORS.MASTER_SCHEDULE.employeeDropdown);
  }

  async selectFirstPayRate(): Promise<void> {
    await this.clickFirstDropdownOption(ALL_LOCATORS.MASTER_SCHEDULE.payRateDropdown);
  }

  async selectFirstPOC(): Promise<void> {
    await this.clickFirstDropdownOption(ALL_LOCATORS.MASTER_SCHEDULE.pocDropdown);
  }

  async selectFirstServiceCode(): Promise<void> {
    await this.clickFirstDropdownOption(ALL_LOCATORS.MASTER_SCHEDULE.serviceCodeDropdown);
  }

  async enableCopyScheduleTo(): Promise<void> {
    await this.page.click(ALL_LOCATORS.MASTER_SCHEDULE.everyDayCheckbox);
  }

  async save(): Promise<void> {
    await this.page.click(ALL_LOCATORS.MASTER_SCHEDULE.saveButton);
    await this.page.waitForLoadState('networkidle');
  }

  async createOneYearRecurringSchedule(options: OneYearRecurringScheduleOptions): Promise<{
    shiftName: string;
    fromDate: string;
    toDate: string;
    startTime: string;
    endTime: string;
  }> {
    const fromDate = options.fromDate ?? new Date();
    const toDate = options.toDate ?? new Date(new Date(fromDate).setFullYear(fromDate.getFullYear() + 1));

    await this.login(options.username, options.password);
    await this.openPatientsRecurringSchedule();
    await this.selectFirstPatient(options.patientSearchText);
    await this.addRecurringSchedule();
    await this.selectRecurringPeriodMonthly();

    const shiftName = await this.setShiftName(options.shiftName);
    await this.setFromToDate(fromDate, toDate);
    const { start, end } = await this.setOneHourSchedule();

    await this.selectFirstEmployee();
    await this.selectFirstPayRate();
    await this.selectFirstPOC();
    await this.selectFirstServiceCode();
    await this.enableCopyScheduleTo();
    await this.save();

    return {
      shiftName,
      fromDate: this.formatDate(fromDate),
      toDate: this.formatDate(toDate),
      startTime: start,
      endTime: end,
    };
  }
}
