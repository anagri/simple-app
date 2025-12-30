import { STORAGE_KEYS, PKCE_DATA_EXPIRY_MS } from './constants';
import type { StoredTokens, PKCEData, AuthUser } from './types';

export class AuthStorage {
  private prefix: string;

  constructor(basePath: string = '/') {
    // Normalize basePath to create storage prefix
    this.prefix = basePath.replace(/\//g, '_').replace(/^_|_$/g, '') || 'app';
  }

  private key(name: string): string {
    return `${this.prefix}_${name}`;
  }

  // Token storage
  getTokens(): StoredTokens | null {
    const data = localStorage.getItem(this.key(STORAGE_KEYS.TOKENS));
    if (!data) return null;
    const tokens = JSON.parse(data) as StoredTokens;
    // Check if tokens are expired
    if (tokens.expiresAt <= Date.now()) {
      this.clearTokens();
      return null;
    }
    return tokens;
  }

  setTokens(tokens: StoredTokens): void {
    localStorage.setItem(this.key(STORAGE_KEYS.TOKENS), JSON.stringify(tokens));
  }

  clearTokens(): void {
    localStorage.removeItem(this.key(STORAGE_KEYS.TOKENS));
  }

  // PKCE storage (temporary, for auth flow)
  getPKCE(): PKCEData | null {
    const data = localStorage.getItem(this.key(STORAGE_KEYS.PKCE));
    if (!data) return null;
    const pkce = JSON.parse(data) as PKCEData;
    // Check if PKCE data is expired (stale auth flow)
    if (Date.now() - pkce.timestamp > PKCE_DATA_EXPIRY_MS) {
      this.clearPKCE();
      return null;
    }
    return pkce;
  }

  setPKCE(pkce: PKCEData): void {
    localStorage.setItem(this.key(STORAGE_KEYS.PKCE), JSON.stringify(pkce));
  }

  clearPKCE(): void {
    localStorage.removeItem(this.key(STORAGE_KEYS.PKCE));
  }

  // User storage
  getUser(): AuthUser | null {
    const data = localStorage.getItem(this.key(STORAGE_KEYS.USER));
    return data ? (JSON.parse(data) as AuthUser) : null;
  }

  setUser(user: AuthUser): void {
    localStorage.setItem(this.key(STORAGE_KEYS.USER), JSON.stringify(user));
  }

  clearUser(): void {
    localStorage.removeItem(this.key(STORAGE_KEYS.USER));
  }

  // Return URL (where to redirect after login)
  getReturnUrl(): string | null {
    return localStorage.getItem(this.key(STORAGE_KEYS.RETURN_URL));
  }

  setReturnUrl(url: string): void {
    localStorage.setItem(this.key(STORAGE_KEYS.RETURN_URL), url);
  }

  clearReturnUrl(): void {
    localStorage.removeItem(this.key(STORAGE_KEYS.RETURN_URL));
  }

  // Clear all auth data
  clearAll(): void {
    this.clearTokens();
    this.clearPKCE();
    this.clearUser();
    this.clearReturnUrl();
  }
}
