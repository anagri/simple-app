import { useEffect, useState, useRef } from 'react';
import { AuthStorage } from './storage';
import {
  buildEndpoints,
  exchangeCodeForTokens,
  tokenResponseToStored,
  parseIdToken,
  createAuthError,
} from './oauth';
import { DEFAULT_POST_LOGIN_REDIRECT } from './constants';
import type { AuthConfig, AuthError } from './types';

interface AuthCallbackProps {
  config: AuthConfig;
  onSuccess?: () => void;
  onError?: (error: AuthError) => void;
}

export function AuthCallback({ config, onSuccess, onError }: AuthCallbackProps) {
  const [error, setError] = useState<AuthError | null>(null);
  const [processing, setProcessing] = useState(true);

  // StrictMode protection - ensure callback logic runs only once
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate execution in React StrictMode
    if (processedRef.current) return;
    processedRef.current = true;

    const handleCallback = async () => {
      const storage = new AuthStorage(config.basePath);
      const endpoints = buildEndpoints(config.authServerUrl);

      // Get URL parameters
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
        setError(authError);
        setProcessing(false);
        onError?.(authError);
        return;
      }

      // Validate code and state
      if (!code || !state) {
        const authError = createAuthError('callback_error', 'Missing code or state parameter');
        setError(authError);
        setProcessing(false);
        onError?.(authError);
        return;
      }

      // Get PKCE data
      const pkce = storage.getPKCE();
      if (!pkce) {
        const authError = createAuthError('pkce_error', 'PKCE data not found or expired');
        setError(authError);
        setProcessing(false);
        onError?.(authError);
        return;
      }

      // Validate state
      if (state !== pkce.state) {
        storage.clearPKCE();
        const authError = createAuthError(
          'state_mismatch',
          'State parameter mismatch (CSRF protection)'
        );
        setError(authError);
        setProcessing(false);
        onError?.(authError);
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
        if (tokenResponse.id_token) {
          const user = parseIdToken(tokenResponse.id_token);
          storage.setUser(user);
        }

        // Clear PKCE data
        storage.clearPKCE();

        // Get return URL and clear it
        const returnUrl = storage.getReturnUrl();
        storage.clearReturnUrl();

        // Clean URL (remove code and state)
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);

        setProcessing(false);
        onSuccess?.();

        // Redirect to return URL or default
        const appUrl = config.appUrl ?? window.location.origin;
        const basePath = config.basePath ?? '/';
        const defaultRedirect = config.postLoginRedirect ?? DEFAULT_POST_LOGIN_REDIRECT;
        const redirectTo = returnUrl ?? `${basePath}${defaultRedirect}`.replace(/\/+/g, '/');
        window.location.href = `${appUrl}${redirectTo}`;
      } catch (err) {
        const authError =
          err instanceof Error && 'code' in err
            ? (err as AuthError)
            : createAuthError('token_error', 'Token exchange failed', err);
        storage.clearPKCE();
        setError(authError);
        setProcessing(false);
        onError?.(authError);
      }
    };

    handleCallback();
  }, [config, onSuccess, onError]);

  if (processing) {
    return (
      <div
        data-testid="auth-callback-loading"
        className="flex min-h-screen items-center justify-center"
      >
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Completing sign in...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        data-testid="auth-callback-error"
        className="flex min-h-screen items-center justify-center"
      >
        <div className="max-w-md p-6 text-center">
          <div className="mb-4 text-5xl text-red-600">!</div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Authentication Failed</h2>
          <p className="mb-4 text-gray-600">{error.message}</p>
          <button
            data-testid="auth-callback-retry"
            onClick={() => (window.location.href = config.appUrl ?? window.location.origin)}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
}
