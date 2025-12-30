export const DEFAULT_SCOPES = ['openid', 'profile', 'email'];
export const DEFAULT_CALLBACK_PATH = '/callback';
export const DEFAULT_POST_LOGIN_REDIRECT = '/';
export const DEFAULT_POST_LOGOUT_REDIRECT = '/';

// Storage keys (will be prefixed with basePath)
export const STORAGE_KEYS = {
  TOKENS: 'auth_tokens',
  PKCE: 'auth_pkce',
  USER: 'auth_user',
  RETURN_URL: 'auth_return_url',
} as const;

// PKCE constants
export const PKCE_VERIFIER_LENGTH = 64;
export const PKCE_STATE_LENGTH = 32;
export const PKCE_NONCE_LENGTH = 32;

// Token refresh buffer (refresh 60 seconds before expiry)
export const TOKEN_REFRESH_BUFFER_MS = 60 * 1000;

// PKCE data expiry (10 minutes max for auth flow)
export const PKCE_DATA_EXPIRY_MS = 10 * 60 * 1000;
