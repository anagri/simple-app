/* eslint-disable react-refresh/only-export-components */
import { type ReactNode } from 'react';
import { vi } from 'vitest';
import { AuthProvider, type AuthConfig } from '../auth';

export const mockAuthConfig: AuthConfig = {
  authServerUrl: 'http://localhost:8080/realms/test',
  clientId: 'test-client',
  basePath: '/simple-app',
  scopes: ['openid', 'profile', 'email'],
};

// Mock window.location.href setter
export function mockWindowLocationHref() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).location;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).location = { ...window.location, href: '' };
  const hrefSpy = vi.fn();
  Object.defineProperty(window.location, 'href', {
    set: hrefSpy,
    get: () => 'http://localhost:5173/simple-app/',
  });
  return hrefSpy;
}

// Test wrapper with AuthProvider
export function AuthTestWrapper({
  children,
  config = mockAuthConfig,
}: {
  children: ReactNode;
  config?: AuthConfig;
}) {
  return <AuthProvider config={config}>{children}</AuthProvider>;
}
