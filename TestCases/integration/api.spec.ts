import { test, expect, request } from '@playwright/test';
import { API_ENDPOINTS } from '@/config/apiEndpoints';
import { TEST_USERS } from '@/data/testData/testData';

test.describe('API Integration Tests', () => {
  let apiContext: any;

  test.beforeAll(async () => {
    apiContext = await request.newContext({
      baseURL: process.env.API_BASE_URL || 'http://localhost:3001/api',
    });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test('should authenticate user via API', async () => {
    const response = await apiContext.post(API_ENDPOINTS.AUTH.LOGIN, {
      data: {
        username: TEST_USERS.VALID_USER.username,
        password: TEST_USERS.VALID_USER.password,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.token).toBeTruthy();
  });

  test('should fetch user profile', async () => {
    // First login to get token
    const loginResponse = await apiContext.post(API_ENDPOINTS.AUTH.LOGIN, {
      data: {
        username: TEST_USERS.MOBILE_USER.username,
        password: TEST_USERS.MOBILE_USER.password,
      },
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    const token = loginData.token;

    // Use token to fetch profile
    const profileResponse = await apiContext.get(API_ENDPOINTS.USER.PROFILE, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(profileResponse.ok()).toBeTruthy();
    const profileData = await profileResponse.json();
    expect(profileData.email).toBe(TEST_USERS.MOBILE_USER.username);
  });

  test('should handle invalid API requests', async () => {
    const response = await apiContext.post(API_ENDPOINTS.AUTH.LOGIN, {
      data: {
        username: 'invalid@example.com',
        password: 'wrongpassword',
      },
    });

    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(401);
  });
});
