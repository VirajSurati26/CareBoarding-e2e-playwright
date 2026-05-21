import { test, expect } from '@playwright/test';
import { LoginPage } from '@/pageObjects/BaseClass/LoginPage';
import { ChangeEntity } from '@/pageObjects/ChangeEntity/ChangeEntity';
import { TEST_USERS, URLS } from '@/data/testData/testData';
import { BaseTest } from '@/base/BaseTest';


test.describe('Change Entity Module', () => {
  test.beforeEach(async ({ page }) => {
    const baseTest = new BaseTest(page);
    await baseTest.maximizeWindow();
    const login = new LoginPage(page);
    await login.navigate();
    await login.login(TEST_USERS.VALID_USER.username, TEST_USERS.VALID_USER.password);
    await baseTest.waitForNetworkIdle();
    expect(page.url()).toContain(URLS.DASHBOARD);
  });

  test('should select Smith HHE entity', async ({ page }) => {
    const changeEntity = new ChangeEntity(page);
    const initialEntity = await changeEntity.getCurrentEntity();
    await changeEntity.selectEntity('Smith HHE');
    const newEntity = await changeEntity.getCurrentEntity();
    expect(newEntity).toBe('Smith HHE');
  });

  // test('should get available entities', async ({ page }) => {
  //   const changeEntity = new ChangeEntity(page);
  //   const entities = await changeEntity.getAvailableEntities();
  //   expect(entities.length).toBeGreaterThan(0);
  // });

});
