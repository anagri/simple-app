import { test, expect } from '@playwright/test';

test('counter starts at 0', async ({ page }) => {
  await page.goto('/');

  const counterButton = page.getByTestId('counter-button');
  await expect(counterButton).toHaveText('count is 0');
});
