import { test, expect } from '@playwright/test';
import { LoginPage } from '@/pageObjects/BaseClass/LoginPage';
import { BasePage } from '@/pageObjects/BaseClass/BasePage';
import { TEST_USERS, URLS } from "@/data/testData/testData";
import { ChangeEntity } from "@/pageObjects/BaseClass/ChangeEntity";
import { Employee } from "@/pageObjects/Employee/Past_Visit_Create_TimeSheet";

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
        await employee.getRandomPastSlot();
        const selectedPatient = await employee.selectPatientByIndex(0);
        const selectedPayRate = await employee.selectPayRateByIndex(1);
        const selectedPOC = await employee.selectPOC("TESTING (671268)");
        const selectedServiceCode = await employee.selectServiceCode("G0156 U7");
        await employee.clickCreateButton();
        await employee.clickOKButtonandPrintValidationMessage();
    });
});
