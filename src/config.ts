import type { AuthConfig } from './auth';

export const authConfig: AuthConfig = {
  authServerUrl: import.meta.env.VITE_AUTH_URL,
  clientId: import.meta.env.VITE_CLIENT_ID,
  appUrl: import.meta.env.VITE_APP_URL,
  basePath: import.meta.env.VITE_BASE_PATH ?? '/simple-app',
  scopes: ['openid', 'profile', 'email'],
  postLoginRedirect: '/',
  postLogoutRedirect: '/',
};

// Validate config at startup
export function validateAuthConfig(config: AuthConfig): void {
  if (!config.authServerUrl) {
    throw new Error('VITE_AUTH_URL is required');
  }
  if (!config.clientId) {
    throw new Error('VITE_CLIENT_ID is required');
  }
}
