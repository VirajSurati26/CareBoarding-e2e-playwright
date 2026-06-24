import { test, expect } from '@playwright/test';
import { BaseTest } from "@/base/BaseTest";
import { TEST_USERS, URLS } from "@/data/testData/testData";
import { ChangeEntity } from "@/pageObjects/BaseClass/ChangeEntity";
import { Employee } from "@/pageObjects/Employee/Past_Visit_Create_TimeSheet";
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
        expect(page.url()).toContain(URLS.DASHBOARD)

        const baseTest = new BaseTest(page);
        await baseTest.maximizeWindow();
        const employee = new Employee(page);
        await employee.clickEmployeeButtonsideMenu();
        await employee.clickSearchEmployeeButton();
        const selectedEmployee = await employee.selectAndOpenEmployee(0);
        expect(selectedEmployee).toBeTruthy();
        // Reuse the same employee instance
        await employee.clickEmployeeButtonsideMenu();
        await employee.clickSearchEmployeeButton();
        await employee.selectAndOpenEmployee(0);
        await employee.clickCalendarButton();
        await employee.selectCurrentDate();
        await employee.generatePastVisitTime();
        const selectedPatient = await employee.selectPatientByIndex(0);
        expect(selectedPatient).toBeTruthy();
        const selectedPayRate = await employee.selectPayRateByIndex(1);
        expect(selectedPayRate).toBeTruthy();
        const selectedPOC = await employee.selectPOC("TESTING (671268)");
        expect(selectedPOC).toBeTruthy();
        const selectedServiceCode = await employee.selectServiceCode("G0156 U7");
        expect(selectedServiceCode).toBeTruthy();
        await employee.clickCreateButton();
        await employee.clickOKButtonandPrintValidationMessage();
    });
});
