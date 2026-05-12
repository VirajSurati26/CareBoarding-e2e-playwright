import { test, expect } from '@playwright/test';
import { request } from '@playwright/test';

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
    const response = await apiContext.post('/auth/login', {
      data: {
        username: 'testuser@example.com',
        password: 'TestPassword123!',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.token).toBeTruthy();
  });

  test('should fetch user profile', async () => {
    // First login to get token
    const loginResponse = await apiContext.post('/auth/login', {
      data: {
        username: 'emily.johnson@yopmail.com',
        password: '12345678',
      },
    });

    const loginData = await loginResponse.json();
    const token = loginData.token;

    // Use token to fetch profile
    const profileResponse = await apiContext.get('/user/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(profileResponse.ok()).toBeTruthy();
    const profileData = await profileResponse.json();
    expect(profileData.email).toBe('testuser@example.com');
  });

  test('should handle invalid API requests', async () => {
    const response = await apiContext.post('/auth/login', {
      data: {
        username: 'invalid@example.com',
        password: 'wrongpassword',
      },
    });

    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(401);
  });
});
