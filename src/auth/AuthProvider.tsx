/* eslint-disable react-refresh/only-export-components */
import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useContext,
  createContext,
  useRef,
  type ReactNode,
} from 'react';
import { AuthStorage } from './storage';
import {
  buildEndpoints,
  buildPKCEData,
  buildAuthorizationUrl,
  refreshTokens,
  tokenResponseToStored,
  parseIdToken,
  revokeToken,
  exchangeCodeForTokens,
  createAuthError,
} from './oauth';
import {
  DEFAULT_CALLBACK_PATH,
  DEFAULT_POST_LOGIN_REDIRECT,
  TOKEN_REFRESH_BUFFER_MS,
} from './constants';
import type {
  AuthConfig,
  AuthState,
  AuthContextValue,
  SignInOptions,
  OAuthEndpoints,
  TokenResponse,
  AuthError,
} from './types';

// Create context
export const AuthContext = createContext<AuthContextValue | null>(null);

// Hook to access auth context
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

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
    isProcessingCallback: false,
    callbackError: null,
    callbackReturnUrl: null,
  });

  // StrictMode protection for callback processing
  const callbackProcessedRef = useRef(false);

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

  // Process OAuth callback
  const processCallback = useCallback(async () => {
    // StrictMode protection
    if (callbackProcessedRef.current) return;
    callbackProcessedRef.current = true;

    updateState({ isProcessingCallback: true, isLoading: false });

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const errorParam = params.get('error');
    const errorDescription = params.get('error_description');

    // Handle OAuth error response
    if (errorParam) {
      const authError = createAuthError('callback_error', errorDescription ?? errorParam, {
        error: errorParam,
        error_description: errorDescription,
      });
      updateState({
        isProcessingCallback: false,
        callbackError: authError,
      });
      return;
    }

    // Validate code and state
    if (!code || !state) {
      const authError = createAuthError('callback_error', 'Missing code or state parameter');
      updateState({
        isProcessingCallback: false,
        callbackError: authError,
      });
      return;
    }

    // Get PKCE data
    const pkce = storage.getPKCE();
    if (!pkce) {
      const authError = createAuthError('pkce_error', 'PKCE data not found or expired');
      updateState({
        isProcessingCallback: false,
        callbackError: authError,
      });
      return;
    }

    // Validate state
    if (state !== pkce.state) {
      storage.clearPKCE();
      const authError = createAuthError(
        'state_mismatch',
        'State parameter mismatch (CSRF protection)'
      );
      updateState({
        isProcessingCallback: false,
        callbackError: authError,
      });
      return;
    }

    try {
      // Exchange code for tokens
      const tokenResponse = await exchangeCodeForTokens(
        endpoints,
        config.clientId,
        code,
        pkce.codeVerifier,
        pkce.redirectUri
      );

      // Store tokens
      const storedTokens = tokenResponseToStored(tokenResponse);
      storage.setTokens(storedTokens);

      // Parse and store user
      let user = null;
      if (tokenResponse.id_token) {
        user = parseIdToken(tokenResponse.id_token);
        storage.setUser(user);
      }

      // Clear PKCE data
      storage.clearPKCE();

      // Get return URL and clear it
      const storedReturnUrl = storage.getReturnUrl();
      storage.clearReturnUrl();

      // Clean URL (remove code and state)
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);

      // Compute redirect URL
      const defaultRedirect = config.postLoginRedirect ?? DEFAULT_POST_LOGIN_REDIRECT;
      const computedReturnUrl =
        storedReturnUrl ?? `${basePath}${defaultRedirect}`.replace(/\/+/g, '/');

      updateState({
        isProcessingCallback: false,
        callbackReturnUrl: `${appUrl}${computedReturnUrl}`,
        isAuthenticated: true,
        user,
      });
    } catch (err) {
      const authError =
        err instanceof Error && 'code' in err
          ? (err as AuthError)
          : createAuthError('token_error', 'Token exchange failed', err);
      storage.clearPKCE();
      updateState({
        isProcessingCallback: false,
        callbackError: authError,
      });
    }
  }, [config, storage, endpoints, appUrl, basePath, updateState]);

  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = async () => {
      // Check if this is OAuth callback (URL has 'code' param)
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        // Process OAuth callback
        await processCallback();
        return;
      }

      // Normal initialization from storage
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
  }, [storage, endpoints, config.clientId, updateState, attemptTokenRefresh, processCallback]);

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
