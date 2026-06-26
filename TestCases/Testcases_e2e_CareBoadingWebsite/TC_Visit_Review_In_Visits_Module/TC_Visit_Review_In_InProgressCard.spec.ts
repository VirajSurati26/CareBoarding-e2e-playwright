import { test, expect } from '@playwright/test';
import { TEST_USERS, URLS } from "@/data/testData/testData";
import { ChangeEntity } from "@/pageObjects/BaseClass/ChangeEntity";
import { LoginPage } from "@/pageObjects/BaseClass/LoginPage";
import { Visit_Review_IN_Visits_Field } from "@/pageObjects/Visits_Module/Visit_Review_In_Visits_Field";
import { BasePage } from '@/pageObjects/BaseClass/BasePage';

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
  const basePage = new BasePage(page);
  await basePage.maximizeWindow();
  await visitReviewPage.ClickINVisitInSideMenu();
  await visitReviewPage.ClickVisitReviewOption();
  await page.waitForTimeout(5000);

    // Verify the select the "In Progress visit" card in Visit review page
    await visitReviewPage.ClickInProgressVisitcard();
    await page.waitForTimeout(5000);
});
