import { Page, expect } from '@playwright/test';
import { TEST_USER_EMAIL, TEST_USER_PASSWORD, TEST_USER_NAME } from '../test-credentials';

export class AuthSection {
  selectors = {
    // App selectors (unauthenticated)
    loginButton: '[data-testid="login-button"]',
    welcomeHeading: 'h1:has-text("Welcome")',
    signInPrompt: 'text=Please sign in to continue',

    // App selectors (authenticated)
    logoutButton: '[data-testid="logout-button"]',
    welcomeUser: `h1:has-text("Welcome, ${TEST_USER_NAME}!")`,
    signedInText: 'text=You are signed in.',

    // Keycloak selectors
    keycloakUsernameInput: '#username',
    keycloakPasswordInput: '#password',
    keycloakSubmitButton: '#kc-login',
    keycloakForm: '#kc-form-login',
  };

  constructor(private page: Page) {}

  async waitForUnauthenticated(): Promise<void> {
    await this.page.locator(this.selectors.loginButton).waitFor({ state: 'visible' });
    await expect(this.page.locator(this.selectors.welcomeHeading)).toBeVisible();
    await expect(this.page.locator(this.selectors.signInPrompt)).toBeVisible();
  }

  async waitForAuthenticated(): Promise<void> {
    await this.page.locator(this.selectors.logoutButton).waitFor({ state: 'visible' });
    await expect(this.page.locator(this.selectors.welcomeUser)).toBeVisible();
    await expect(this.page.locator(this.selectors.signedInText)).toBeVisible();
  }

  async clickLogin(): Promise<void> {
    await this.page.locator(this.selectors.loginButton).click();
    // Wait for Keycloak form to load
    await this.page.locator(this.selectors.keycloakForm).waitFor({ state: 'visible' });
  }

  async fillKeycloakForm(): Promise<void> {
    await this.page.fill(this.selectors.keycloakUsernameInput, TEST_USER_EMAIL);
    await this.page.fill(this.selectors.keycloakPasswordInput, TEST_USER_PASSWORD);
    await this.page.click(this.selectors.keycloakSubmitButton);
  }

  async logout(): Promise<void> {
    await this.page.locator(this.selectors.logoutButton).click();
  }

  async expectUserDetails(name: string): Promise<void> {
    await expect(this.page.locator(`h1:has-text("Welcome, ${name}!")`)).toBeVisible();
    await expect(this.page.locator(this.selectors.signedInText)).toBeVisible();
  }

  /**
   * Complete OAuth login flow
   * Consolidates: waitForUnauthenticated() + clickLogin() + fillKeycloakForm() + waitForAuthenticated()
   */
  async loginWithKeycloak(): Promise<void> {
    await this.waitForUnauthenticated();
    await this.clickLogin();
    await this.fillKeycloakForm();
    await this.waitForAuthenticated();
    await this.expectUserDetails(TEST_USER_NAME);
  }

  /**
   * Complete OAuth logout flow
   * Note: Keycloak may redirect through logout endpoint, so we handle that
   */
  async logoutWithKeycloak(): Promise<void> {
    await this.logout();

    // After logout, Keycloak redirects through logout endpoint then back to app
    // Wait for either the app URL or continue if already there
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      // Ignore timeout - page might already be loaded
    });

    // If we're on an error page (Invalid redirect uri), navigate back to app
    const currentUrl = this.page.url();
    if (currentUrl.includes('getbodhi.app') || currentUrl.includes('error')) {
      await this.page.goto('/');
    }

    await this.waitForUnauthenticated();
  }
}
