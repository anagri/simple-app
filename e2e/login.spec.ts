import { test } from '@playwright/test';
import { AuthSection } from './pages/auth-section';

test.describe('OAuth 2.1 Authentication Flow', () => {
  test('complete login and logout flow with Keycloak', async ({ page }) => {
    const authSection = new AuthSection(page);

    // Navigate to app
    await page.goto('/');

    // Complete login flow
    await authSection.loginWithKeycloak();

    // Complete logout flow
    await authSection.logoutWithKeycloak();
  });
});
