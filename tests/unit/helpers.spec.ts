import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../src/helpers/TestHelpers';

test.describe('TestHelpers Unit Tests', () => {
  test('should generate random email', () => {
    const email = TestHelpers.generateRandomEmail();
    expect(email).toMatch(/^[a-zA-Z0-9]+@example\.com$/);
    expect(email.length).toBeGreaterThan(15);
  });

  test('should generate random string with specified length', () => {
    const randomString = TestHelpers.generateRandomString(10);
    expect(randomString).toHaveLength(10);
    expect(randomString).toMatch(/^[a-zA-Z0-9]+$/);
  });

  test('should generate random string with default length', () => {
    const randomString = TestHelpers.generateRandomString();
    expect(randomString).toHaveLength(8);
  });

  test('should generate random number within range', () => {
    const randomNumber = TestHelpers.generateRandomNumber(1, 10);
    expect(randomNumber).toBeGreaterThanOrEqual(1);
    expect(randomNumber).toBeLessThanOrEqual(10);
  });

  test('should generate test data array', () => {
    const testData = TestHelpers.generateTestData(3);
    expect(testData).toHaveLength(3);
    expect(testData[0]).toHaveProperty('username');
    expect(testData[0]).toHaveProperty('password');
    expect(testData[0].username).toMatch(/@example\.com$/);
  });

  test('should generate unique emails', () => {
    const email1 = TestHelpers.generateRandomEmail();
    const email2 = TestHelpers.generateRandomEmail();
    expect(email1).not.toBe(email2);
  });

  test('should get current timestamp', () => {
    const timestamp = TestHelpers.getCurrentTimestamp();
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/);
  });
});
