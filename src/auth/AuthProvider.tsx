import { useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import { AuthStorage } from './storage';
import {
  buildEndpoints,
  buildPKCEData,
  buildAuthorizationUrl,
  refreshTokens,
  tokenResponseToStored,
  parseIdToken,
  revokeToken,
} from './oauth';
import { DEFAULT_CALLBACK_PATH, TOKEN_REFRESH_BUFFER_MS } from './constants';
import type { AuthConfig, AuthState, SignInOptions, OAuthEndpoints, TokenResponse } from './types';

interface AuthProviderProps {
  config: AuthConfig;
  children: ReactNode;
}

export function AuthProvider({ config, children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
  });

  // Memoize derived values
  const storage = useMemo(() => new AuthStorage(config.basePath), [config.basePath]);
  const endpoints = useMemo(() => buildEndpoints(config.authServerUrl), [config.authServerUrl]);
  const appUrl = useMemo(() => config.appUrl ?? window.location.origin, [config.appUrl]);
  const basePath = useMemo(() => config.basePath ?? '/', [config.basePath]);

  // Build full URL with base path
  const buildUrl = useCallback(
    (path: string) => {
      const normalizedBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      return `${appUrl}${normalizedBase}${normalizedPath}`;
    },
    [appUrl, basePath]
  );

  // Update state helper
  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Attempt token refresh
  const attemptTokenRefresh = useCallback(
    async (ep: OAuthEndpoints, clientId: string, refreshToken: string): Promise<boolean> => {
      try {
        const response: TokenResponse = await refreshTokens(ep, clientId, refreshToken);
        const stored = tokenResponseToStored(response);
        storage.setTokens(stored);
        if (response.id_token) {
          const user = parseIdToken(response.id_token);
          storage.setUser(user);
          updateState({ user });
        }
        return true;
      } catch {
        storage.clearAll();
        return false;
      }
    },
    [storage, updateState]
  );

  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = async () => {
      const tokens = storage.getTokens();
      const user = storage.getUser();

      if (tokens && user) {
        // Check if token needs refresh
        if (tokens.expiresAt - Date.now() < TOKEN_REFRESH_BUFFER_MS && tokens.refreshToken) {
          const refreshed = await attemptTokenRefresh(
            endpoints,
            config.clientId,
            tokens.refreshToken
          );
          if (refreshed) {
            updateState({ isAuthenticated: true, user, isLoading: false });
            return;
          }
        } else {
          updateState({ isAuthenticated: true, user, isLoading: false });
          return;
        }
      }

      updateState({ isLoading: false });
    };

    initAuth();
  }, [storage, endpoints, config.clientId, updateState, attemptTokenRefresh]);

  // Sign in - redirect to authorization server
  const signIn = useCallback(
    async (options?: SignInOptions) => {
      updateState({ error: null });

      const callbackPath = config.callbackPath ?? DEFAULT_CALLBACK_PATH;
      const redirectUri = options?.redirectUri ?? buildUrl(callbackPath);

      // Store current URL for post-login redirect
      const returnUrl = window.location.pathname + window.location.search;
      storage.setReturnUrl(returnUrl);

      // Generate and store PKCE data
      const pkce = await buildPKCEData(redirectUri);
      storage.setPKCE(pkce);

      // Build and redirect to authorization URL
      const authUrl = buildAuthorizationUrl(config, endpoints, pkce, {
        prompt: options?.prompt,
        loginHint: options?.loginHint,
      });

      window.location.href = authUrl;
    },
    [config, endpoints, storage, buildUrl, updateState]
  );

  // Sign out - revoke tokens via API
  const signOut = useCallback(async () => {
    const tokens = storage.getTokens();

    // Revoke tokens via API (best effort)
    if (tokens?.refreshToken) {
      await revokeToken(endpoints, config.clientId, tokens.refreshToken, 'refresh_token');
    }
    if (tokens?.accessToken) {
      await revokeToken(endpoints, config.clientId, tokens.accessToken, 'access_token');
    }

    // Clear storage
    storage.clearAll();

    // Update state
    updateState({
      isAuthenticated: false,
      user: null,
      error: null,
    });

    // Note: We skip Keycloak logout redirect since:
    // 1. Tokens are already revoked via API
    // 2. Local storage is cleared
    // 3. Redirect requires post_logout_redirect_uri to be configured in Keycloak
  }, [config, endpoints, storage, updateState]);

  // Get access token (with auto-refresh)
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const tokens = storage.getTokens();
    if (!tokens) return null;

    // Check if token needs refresh
    if (tokens.expiresAt - Date.now() < TOKEN_REFRESH_BUFFER_MS && tokens.refreshToken) {
      const success = await attemptTokenRefresh(endpoints, config.clientId, tokens.refreshToken);
      if (!success) {
        updateState({ isAuthenticated: false, user: null });
        return null;
      }
      return storage.getTokens()?.accessToken ?? null;
    }

    return tokens.accessToken;
  }, [storage, endpoints, config.clientId, updateState, attemptTokenRefresh]);

  // Manual refresh
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    const tokens = storage.getTokens();
    if (!tokens?.refreshToken) return false;

    return attemptTokenRefresh(endpoints, config.clientId, tokens.refreshToken);
  }, [storage, endpoints, config.clientId, attemptTokenRefresh]);

  // Context value
  const contextValue = useMemo(
    () => ({
      ...state,
      signIn,
      signOut,
      getAccessToken,
      refreshAccessToken,
    }),
    [state, signIn, signOut, getAccessToken, refreshAccessToken]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
