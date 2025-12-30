import { type ReactNode } from 'react';
import { useAuth } from './useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectToLogin?: boolean;
}

export function ProtectedRoute({
  children,
  fallback,
  redirectToLogin = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, signIn } = useAuth();

  if (isLoading) {
    return (
      fallback ?? (
        <div
          data-testid="protected-route-loading"
          className="flex min-h-screen items-center justify-center"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    if (redirectToLogin) {
      // Trigger sign in (will redirect to auth server)
      signIn();
      return (
        <div
          data-testid="protected-route-redirecting"
          className="flex min-h-screen items-center justify-center"
        >
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      );
    }
    return (
      fallback ?? (
        <div
          data-testid="protected-route-unauthorized"
          className="flex min-h-screen items-center justify-center"
        >
          <p className="text-gray-600">Please sign in to view this page.</p>
        </div>
      )
    );
  }

  return <>{children}</>;
}
