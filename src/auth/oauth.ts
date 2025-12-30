import type {
  AuthConfig,
  OAuthEndpoints,
  PKCEData,
  TokenResponse,
  StoredTokens,
  AuthUser,
  AuthError,
} from './types';
import {
  DEFAULT_SCOPES,
  PKCE_VERIFIER_LENGTH,
  PKCE_STATE_LENGTH,
  PKCE_NONCE_LENGTH,
} from './constants';

// Construct OAuth endpoints for Keycloak
export function buildEndpoints(authServerUrl: string): OAuthEndpoints {
  const base = authServerUrl.replace(/\/$/, '');
  return {
    authorization: `${base}/protocol/openid-connect/auth`,
    token: `${base}/protocol/openid-connect/token`,
    userinfo: `${base}/protocol/openid-connect/userinfo`,
    logout: `${base}/protocol/openid-connect/logout`,
    revocation: `${base}/protocol/openid-connect/revoke`,
  };
}

// Generate cryptographically secure random string
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length);
}

// Generate PKCE code verifier (RFC 7636)
export function generateCodeVerifier(): string {
  return generateRandomString(PKCE_VERIFIER_LENGTH);
}

// Generate PKCE code challenge (SHA-256, base64url encoded)
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
}

// Base64 URL encoding (RFC 4648)
function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Generate state parameter for CSRF protection
export function generateState(): string {
  return generateRandomString(PKCE_STATE_LENGTH);
}

// Generate nonce for ID token validation
export function generateNonce(): string {
  return generateRandomString(PKCE_NONCE_LENGTH);
}

// Build PKCE data for auth flow
export async function buildPKCEData(redirectUri: string): Promise<PKCEData> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  return {
    codeVerifier,
    codeChallenge,
    state: generateState(),
    nonce: generateNonce(),
    redirectUri,
    timestamp: Date.now(),
  };
}

// Build authorization URL
export function buildAuthorizationUrl(
  config: AuthConfig,
  endpoints: OAuthEndpoints,
  pkce: PKCEData,
  options?: { prompt?: string; loginHint?: string }
): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: pkce.redirectUri,
    scope: (config.scopes ?? DEFAULT_SCOPES).join(' '),
    state: pkce.state,
    nonce: pkce.nonce,
    code_challenge: pkce.codeChallenge,
    code_challenge_method: 'S256',
  });

  if (options?.prompt) {
    params.set('prompt', options.prompt);
  }
  if (options?.loginHint) {
    params.set('login_hint', options.loginHint);
  }

  return `${endpoints.authorization}?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(
  endpoints: OAuthEndpoints,
  clientId: string,
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<TokenResponse> {
  const response = await fetch(endpoints.token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw createAuthError('token_error', `Token exchange failed: ${response.status}`, error);
  }

  return response.json() as Promise<TokenResponse>;
}

// Refresh access token
export async function refreshTokens(
  endpoints: OAuthEndpoints,
  clientId: string,
  refreshToken: string
): Promise<TokenResponse> {
  const response = await fetch(endpoints.token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw createAuthError('refresh_error', `Token refresh failed: ${response.status}`, error);
  }

  return response.json() as Promise<TokenResponse>;
}

// Convert token response to stored format
export function tokenResponseToStored(response: TokenResponse): StoredTokens {
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    idToken: response.id_token,
    expiresAt: Date.now() + response.expires_in * 1000,
    tokenType: response.token_type,
  };
}

// Parse JWT payload (ID token) without validation
// Note: In production, consider validating signature
export function parseIdToken(idToken: string): AuthUser {
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw createAuthError('token_error', 'Invalid ID token format');
  }
  const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  return {
    sub: payload.sub,
    email: payload.email,
    email_verified: payload.email_verified,
    name: payload.name,
    preferred_username: payload.preferred_username,
    given_name: payload.given_name,
    family_name: payload.family_name,
  };
}

// Build logout URL
export function buildLogoutUrl(
  endpoints: OAuthEndpoints,
  idToken: string | undefined,
  postLogoutRedirectUri: string
): string {
  const params = new URLSearchParams({
    post_logout_redirect_uri: postLogoutRedirectUri,
  });
  if (idToken) {
    params.set('id_token_hint', idToken);
  }
  return `${endpoints.logout}?${params.toString()}`;
}

// Revoke token (if supported)
export async function revokeToken(
  endpoints: OAuthEndpoints,
  clientId: string,
  token: string,
  tokenTypeHint: 'access_token' | 'refresh_token'
): Promise<void> {
  if (!endpoints.revocation) return;

  await fetch(endpoints.revocation, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      token,
      token_type_hint: tokenTypeHint,
    }),
  });
  // Ignore errors - revocation is best-effort
}

// Create typed auth error
export function createAuthError(
  code: AuthError['code'],
  message: string,
  details?: unknown
): AuthError {
  return { code, message, details };
}
