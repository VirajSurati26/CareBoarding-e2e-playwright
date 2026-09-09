import { test, expect } from '@playwright/test';
import { TEST_USERS, URLS } from "@/data/testData/testData";
import { ChangeEntity } from "@/pageObjects/BaseClass/ChangeEntity";
import { LoginPage } from "@/pageObjects/BaseClass/LoginPage";
import { Visit_Review_IN_Visits_Field } from "@/pageObjects/Visits_Module/Visit_Review_In_Visits_Field";

const loginAndSelectEntity = async (page: any) => {
    const loginPage = new LoginPage(page);
    const changeEntity = new ChangeEntity(page);
    await loginPage.goto(URLS.LOGIN);
    await loginPage.maximizeWindow();
    await loginPage.login(TEST_USERS.ADMIN_USER.username, TEST_USERS.ADMIN_USER.password);
    await changeEntity.selectEntity('Pennsylvania (PA)');
    await changeEntity.selectAreYouSureConfirmButton();
};

test('Visit Review appears in Visits module', async ({ page }) => {
  await loginAndSelectEntity(page);
    const visitReviewPage = new Visit_Review_IN_Visits_Field(page);
    await visitReviewPage.ClickINVisitInSideMenu();
    await page.waitForTimeout(5000);
    await visitReviewPage.ClickVisitReviewOption();

    //Verify the select the "InCompleted visit" card in Visit review page
    await visitReviewPage.ClickInCompletedStatusDropdown();
    await page.waitForTimeout(5000);

    //-------------------------------------------------------------------------------------
    //--------------------Verification of "Scheduled" card Data----------------------------------
    //-------------------------------------------------------------------------------------

    // //Select the column for export file
    // await visitReviewPage.ClickSelectColumnToExport();
    // await page.waitForTimeout(5000);

    // //Verify and click the required fields in select column to export
    // await visitReviewPage.VerifyAndClickRequiredFields();
    // await page.waitForTimeout(5000);

    // //Click the Export button
    // await visitReviewPage.ClickExport();
    // await page.waitForTimeout(5000);

    // //Verify the export file is downloaded
    // await visitReviewPage.VerifyExportFile();
    // await page.waitForTimeout(5000);
});