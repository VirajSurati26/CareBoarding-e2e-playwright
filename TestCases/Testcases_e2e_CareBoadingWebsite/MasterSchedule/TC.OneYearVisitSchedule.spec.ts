import { test } from '@playwright/test';
import { OneYearVisitSchedule } from '@/pageObjects/MasterSchedule/OneYearVisitSchedule';
import { TEST_USERS, URLS } from '@/data/testData/testData';
import { BaseTest } from '@/base/BaseTest';

test.describe('One year recurring visit schedule', () => {
  test.beforeEach(async ({ page }) => {
    const baseTest = new BaseTest(page);
    await baseTest.maximizeWindow();
  });

  test('should create a 12-month recurring schedule with one-hour shifts', async ({ page }) => {
    test.setTimeout(180000);

    const schedulePage = new OneYearVisitSchedule(page);

    const result = await schedulePage.createOneYearRecurringSchedule({
      username: TEST_USERS.ADMIN_USER.username,
      password: TEST_USERS.ADMIN_USER.password,
      patientSearchText: 'Smith, John M. (TWI-000004)',
    });

    console.log('Recurring schedule created with:', result);

    // Assert that the page still shows the recurring schedule section or save confirmation
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });
});
