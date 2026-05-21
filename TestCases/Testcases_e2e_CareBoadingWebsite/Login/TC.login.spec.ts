import { test, expect } from '@playwright/test';
import { LoginPage } from '@/pageObjects/BaseClass/LoginPage';
import { TEST_USERS, URLS } from '@/data/testData/testData';
import { BaseTest } from '@/base/BaseTest';


test.describe('Login Module', () => {
  test('login with valid credentials', async ({ page }) => {
    const baseTest = new BaseTest(page);
    const login = new LoginPage(page);
    
    await login.navigate();
    await login.login(TEST_USERS.VALID_USER.username, TEST_USERS.VALID_USER.password);
    await baseTest.waitForNetworkIdle();

    expect(page.url()).toContain(URLS.DASHBOARD);
  });
});

//   test.skip('login with invalid credentials shows error', async ({ page }) => {
//     // Skipping this test for now
//   });
