import { test, expect } from '@playwright/test';
import { TEST_USERS, URLS } from "@/data/testData/testData";
import { ChangeEntity } from "@/pageObjects/BaseClass/ChangeEntity";
import { LoginPage } from "@/pageObjects/BaseClass/LoginPage";
import { Visit_Review_IN_Visits_Field } from "@/pageObjects/Visits/Visit_Review_In_Visits_Field";

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
  await visitReviewPage.ClickINVisitInSideMenu();
  await expect(page.locator('h1', { hasText: /Visit Review/i })).toBeVisible();
});
