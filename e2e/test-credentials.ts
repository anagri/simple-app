// Eager credential validation - fail fast in CI
if (!process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD) {
  throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env');
}

export const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL!;
export const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD!;
export const TEST_USER_NAME = 'Regular User';
