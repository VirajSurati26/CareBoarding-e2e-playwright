import { test, expect } from '@playwright/test';
import { BaseTest } from "@/base/BaseTest";
import { TEST_USERS, URLS } from "@/data/testData/testData";
import { ChangeEntity } from "@/pageObjects/ChangeEntity/ChangeEntity";
import { Employee } from "@/pageObjects/Employee/Employee";
import { LoginPage } from "@/pageObjects/BaseClass/LoginPage";

const loginAndSelectEntity = async (page: any) => {
  const loginPage = new LoginPage(page);
  const changeEntity = new ChangeEntity(page);
  await loginPage.goto(URLS.LOGIN);
  await loginPage.login(TEST_USERS.ADMIN_USER.username, TEST_USERS.ADMIN_USER.password);
  await changeEntity.selectEntity('Smith HHE');
};

test.describe('Select employees module', () => {
  test('Login and select entity', async ({ page }) => {
    test.setTimeout(60000);
    await loginAndSelectEntity(page);
    expect(page.url()).toContain(URLS.DASHBOARD);
  });

  test.describe('after login and entity selection', () => {
    test.beforeEach(async ({ page }) => {
      const baseTest = new BaseTest(page);
      await baseTest.maximizeWindow();
      await loginAndSelectEntity(page);
    });

    test('Employee search and open', async ({ page }) => {
      const employee = new Employee(page);
      await employee.clickEmployeeButtonsideMenu();
      await employee.clickSearchEmployeeButton();
      const selectedEmployee = await employee.selectAndOpenEmployee(0);
      expect(selectedEmployee).toBeTruthy();
    });

    test('Create visit', async ({ page }) => {
      test.setTimeout(60000);
      const employee = new Employee(page);
      await employee.clickEmployeeButtonsideMenu();
      await employee.clickSearchEmployeeButton();
      await employee.selectAndOpenEmployee(0);
      await employee.clickCalendarButton();
      await employee.selectCurrentDate();
      const { startTime, endTime } = await employee.generateNonOverlappingVisitTime();
      await employee.fillVisitTime(startTime, endTime);
      const selectedPatient = await employee.selectPatientByIndex(0);
      expect(selectedPatient).toBeTruthy();
      const selectedPayRate = await employee.selectPayRateByIndex(1);
      expect(selectedPayRate).toBeTruthy();
      const selectedPOC = await employee.selectPOCByIndex(0);
      expect(selectedPOC).toBeTruthy();
      const selectedServiceCode = await employee.selectServiceCodeByIndex(0);
      expect(selectedServiceCode).toBeTruthy();
      await employee.clickCreateButton();
      await employee.clickOKButtonandPrintValidationMessage();
    });
  });
});
