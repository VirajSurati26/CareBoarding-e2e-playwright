import { test, expect } from '@playwright/test';
import { TEST_USERS, URLS } from "@/data/testData/testData";
import { ChangeEntity } from "@/pageObjects/BaseClass/ChangeEntity";
import { LoginPage } from "@/pageObjects/BaseClass/LoginPage";
import { Visit_Review_IN_Visits_Field } from "@/pageObjects/Visits_Module/Visit_Review_In_Visits_Field";

const loginAndSelectEntity = async (page: any) => {
    const loginPage = new LoginPage(page);
    const changeEntity = new ChangeEntity(page);
    await loginPage.goto(URLS.LOGIN);
    await loginPage.login(TEST_USERS.ADMIN_USER.username, TEST_USERS.ADMIN_USER.password);
    await changeEntity.selectEntity('Smith HHE');
};

test('Visit Review appears in Visits module', async ({ page }) => {
    await loginAndSelectEntity(page);
    const visitReviewPage = new Visit_Review_IN_Visits_Field(page);
    await visitReviewPage.maximizeWindow();
    await visitReviewPage.ClickINVisitInSideMenu();
    await visitReviewPage.ClickVisitReviewOption();
    await page.waitForTimeout(5000);

    //Verify the select the "Scheduled visit" card in Visit review page
    await visitReviewPage.ClickScheduledVisitcard();
    await page.waitForTimeout(5000)

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
