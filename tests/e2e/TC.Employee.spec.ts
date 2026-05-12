import { BaseTest } from "@/base/BaseTest";
import { TEST_USERS, URLS } from "@/data/testData/testData";
import { ChangeEntity } from "@/pageObjects/ChangeEntity";
import { Employee } from "@/pageObjects/Employee";
import { LoginPage } from "@/pageObjects/LoginPage";
import test from "@playwright/test";

test.describe('Select employees module', () => {
  test.beforeEach(async ({ page }) => {
    const baseTest = new BaseTest(page);
    await baseTest.maximizeWindow();

  });

  test('Login and navigate to Employee search', async ({ page }) => {
    test.setTimeout(60000);
    const loginPage = new LoginPage(page);
    const changeEntity = new ChangeEntity(page);
    const employee = new Employee(page);  
    await loginPage.goto(URLS.LOGIN);
    await loginPage.login(TEST_USERS.ADMIN_USER.username, TEST_USERS.ADMIN_USER.password);
    await changeEntity.selectEntity('Smith HHE');
    await employee.clickEmployeeButtonsideMenu();
    await employee.clickSearchEmployeeButton();
    const selectedEmployee = await employee.selectAndOpenEmployee(0);
    console.log('Selected and opened employee:', selectedEmployee);
    await employee.clickCalendarButton();
    await employee.selectCurrentDate();
    await employee.generateVisitAtRandomTime();
    const selectedPatient = await employee.selectPatientByIndex(0);
    console.log('Selected patients name:', selectedPatient);
    const selectedPayRate = await employee.selectPayRateByIndex(1);
    console.log('Selected pay rate:', selectedPayRate);
    const selectedPOC = await employee.selectPOCByIndex(0);
    console.log('Selected POC:', selectedPOC);
    const selectedServiceCode = await employee.selectServiceCodeByIndex(0);
    console.log('Selected service code:', selectedServiceCode);
    await employee.clickCreateButton();
    await employee.clickOKButtonandPrintValidationMessage();
    
    // await page.pause();
  });

});
