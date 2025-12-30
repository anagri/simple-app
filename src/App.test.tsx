import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from './App';
import { AuthTestWrapper } from './test/auth-utils';

// Mock config module to avoid env var validation errors
vi.mock('./config', () => ({
  authConfig: {
    authServerUrl: 'http://localhost:8080/realms/test',
    clientId: 'test-client',
    basePath: '/simple-app',
    scopes: ['openid', 'profile', 'email'],
  },
  validateAuthConfig: vi.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset window.location
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).location;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).location = {
      ...window.location,
      pathname: '/simple-app/',
      search: '',
      origin: 'http://localhost:5173',
    };
  });

  it('renders login screen with welcome message', async () => {
    render(
      <AuthTestWrapper>
        <App />
      </AuthTestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome')).toBeInTheDocument();
    });
    expect(screen.getByText('Please sign in to continue')).toBeInTheDocument();
  });

  it('renders login button', async () => {
    render(
      <AuthTestWrapper>
        <App />
      </AuthTestWrapper>
    );

    await waitFor(() => {
      const loginButton = screen.getByTestId('login-button');
      expect(loginButton).toBeInTheDocument();
      expect(loginButton).toHaveTextContent('Login');
    });
  });

  it('login button triggers OAuth redirect', async () => {
    // Mock window.location before rendering
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).location;
    const hrefSpy = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).location = {
      ...window.location,
      pathname: '/simple-app/',
      search: '',
      origin: 'http://localhost:5173',
      href: '',
    };
    Object.defineProperty(window.location, 'href', {
      set: hrefSpy,
      get: () => 'http://localhost:5173/simple-app/',
    });

    const user = userEvent.setup();

    render(
      <AuthTestWrapper>
        <App />
      </AuthTestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('login-button')).toBeInTheDocument();
    });

    const loginButton = screen.getByTestId('login-button');
    await user.click(loginButton);

    // Should redirect to Keycloak authorization endpoint
    await waitFor(() => {
      expect(hrefSpy).toHaveBeenCalled();
      const redirectUrl = hrefSpy.mock.calls[0][0];
      expect(redirectUrl).toContain(
        'http://localhost:8080/realms/test/protocol/openid-connect/auth'
      );
      expect(redirectUrl).toContain('client_id=test-client');
      expect(redirectUrl).toContain('response_type=code');
      expect(redirectUrl).toContain('code_challenge=');
      expect(redirectUrl).toContain('state=');
    });
  });
});
