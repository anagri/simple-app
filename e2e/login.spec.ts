import { test, expect } from '@playwright/test';

test('login screen displays welcome message', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Welcome')).toBeVisible();
  await expect(page.getByText('Please sign in to continue')).toBeVisible();
});

test('login button is present and clickable', async ({ page }) => {
  await page.goto('/');

  const loginButton = page.getByTestId('login-button');
  await expect(loginButton).toBeVisible();
  await expect(loginButton).toHaveText('Login');

  await loginButton.click();
  // Button should still be visible after click (no-op handler)
  await expect(loginButton).toBeVisible();
});
