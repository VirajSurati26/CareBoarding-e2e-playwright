import { test, expect } from '@playwright/test';
import { LoginPage } from "@/pageObjects/BaseClass/LoginPage";
import { TEST_USERS, URLS } from "@/data/testData/testData";
import { ChangeEntity } from "@/pageObjects/BaseClass/ChangeEntity";
import { BasePage } from "@/pageObjects/BaseClass/BasePage";
import { Employee } from "@/pageObjects/Employee/Reguler_Visit_Create_Employee";
import { time } from 'console';

const loginAndSelectEntity = async (page: any) => {
  const loginPage = new LoginPage(page);
  const changeEntity = new ChangeEntity(page);
  await loginPage.goto(URLS.LOGIN);
  await loginPage.login(TEST_USERS.ADMIN_USER.username, TEST_USERS.ADMIN_USER.password);
  await changeEntity.selectEntity('Pennsylvania (PA)');
  await changeEntity.selectAreYouSureConfirmButton();
};

test.describe('Select employees module', () => {
  test('Login, select entity, search and open employee', async ({ page }) => {
    test.setTimeout(180000);

    const basePage = new BasePage(page);
    await basePage.maximizeWindow();
    await loginAndSelectEntity(page);
    expect(page.url()).toContain(URLS.DASHBOARD);
    const employee = new Employee(page);
    await employee.SearchEmployeePatientorPayer();
    await page.waitForTimeout(3000);
    // await employee.clickEmployeeButtonsideMenu();
    // await employee.clickSearchEmployeeButton();
    // await employee.selectAndOpenEmployee(0);
    await employee.clickCalendarButton();
    await employee.selectCurrentDate();
    const { startTime, endTime } = await employee.generateNonOverlappingVisitTime();
    await employee.fillVisitTime(startTime, endTime);
    await employee.selectPatientByIndex(0);
    await employee.selectPayRateByIndex(1);
    await employee.selectPOC("TESTING (671268)");
    await page.waitForTimeout(3000);
    await employee.selectServiceCode("G0156 U7");
    await page.waitForTimeout(3000);
    await employee.clickCreateButton();
    await employee.clickOKButtonandPrintValidationMessage();
    await page.waitForTimeout(3000);
  });
});