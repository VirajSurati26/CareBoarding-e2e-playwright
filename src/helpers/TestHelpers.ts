export class TestHelpers {
  static generateRandomEmail(): string {
    return `test${Math.random().toString(36).substring(2, 9)}@example.com`;
  }

  static generateRandomString(length: number = 8): string {
    return Math.random().toString(36).substring(2, 2 + length);
  }

  static generateRandomNumber(min: number = 1, max: number = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static getCurrentTimestamp(): string {
    return new Date().toISOString().replace(/[:.]/g, '-');
  }

  static generateTestData(count: number): Array<{ username: string; password: string }> {
    return Array.from({ length: count }, (_, index) => ({
      username: `user${index + 1}@example.com`,
      password: `Password${index + 1}!`,
    }));
  }
}
