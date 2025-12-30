// Configuration passed to AuthProvider
export interface AuthConfig {
  authServerUrl: string; // Keycloak realm URL (e.g., http://localhost:8080/realms/myrealm)
  clientId: string; // Public client ID
  appUrl?: string; // Application URL (fallback: window.location.origin)
  basePath?: string; // For localStorage namespacing (default: '/')
  callbackPath?: string; // OAuth callback path (default: '/callback')
  scopes?: string[]; // OAuth scopes (default: ['openid', 'profile', 'email'])
  postLoginRedirect?: string; // Redirect after login (default: '/')
}

// User information from ID token
export interface AuthUser {
  sub: string; // Subject identifier
  email?: string;
  email_verified?: boolean;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
}

// Token response from authorization server
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
}

// Stored token data with metadata
export interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: number; // Unix timestamp
  tokenType: string;
}

// PKCE data stored temporarily during auth flow
export interface PKCEData {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
  nonce: string;
  redirectUri: string;
  timestamp: number;
}

// Auth context state
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  error: AuthError | null;
}

// Error types
export type AuthErrorCode =
  | 'config_error'
  | 'network_error'
  | 'token_error'
  | 'callback_error'
  | 'state_mismatch'
  | 'pkce_error'
  | 'token_expired'
  | 'refresh_error'
  | 'logout_error'
  | 'unknown_error';

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: unknown;
}

// Context value exposed by useAuth()
export interface AuthContextValue extends AuthState {
  signIn: (options?: SignInOptions) => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  refreshAccessToken: () => Promise<boolean>;
}

export interface SignInOptions {
  redirectUri?: string; // Override default callback
  prompt?: 'none' | 'login' | 'consent';
  loginHint?: string; // Pre-fill username
}

// OAuth endpoints discovered or constructed
export interface OAuthEndpoints {
  authorization: string;
  token: string;
  userinfo: string;
  logout: string;
  revocation?: string;
}
