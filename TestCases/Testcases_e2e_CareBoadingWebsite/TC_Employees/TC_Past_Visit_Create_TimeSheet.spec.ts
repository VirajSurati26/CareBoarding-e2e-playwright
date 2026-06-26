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
    await changeEntity.selectEntity('Smith HHE');
};

test.describe('Select employees module', () => {
    test.beforeEach(async ({ page }) => {
        await loginAndSelectEntity(page);
        const basePage = new BasePage(page);
        await basePage.maximizeWindow();
    });

    test('Login and select entity', async ({ page }) => {
        test.setTimeout(60000);
        expect(page.url()).toContain(URLS.DASHBOARD);
    });

    test('Select employee and create past visit', async ({ page }) => {
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
