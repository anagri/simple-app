import './App.css';
import { useAuth, AuthCallback } from './auth';
import { authConfig } from './config';

function App() {
  // Simple client-side routing based on path
  const path = window.location.pathname;
  const basePath = authConfig.basePath ?? '/simple-app';
  const relativePath = path.replace(basePath, '') || '/';

  // Handle callback route
  if (relativePath === '/callback') {
    return <AuthCallback config={authConfig} />;
  }

  return <MainContent />;
}

function MainContent() {
  const { isAuthenticated, isLoading, user, signIn, signOut, error } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.name ?? user.email}!</h1>
          <p className="text-gray-600">You are signed in.</p>
          <button
            data-testid="logout-button"
            onClick={() => signOut()}
            className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome</h1>
          <p className="mt-2 text-sm text-gray-600">Please sign in to continue</p>
        </div>
        {error && (
          <div data-testid="auth-error" className="rounded bg-red-50 p-3 text-red-700">
            {error.message}
          </div>
        )}
        <button
          data-testid="login-button"
          onClick={() => signIn()}
          className="w-full rounded-md bg-blue-600 px-4 py-3 text-white hover:bg-blue-700"
        >
          Login
        </button>
      </div>
    </div>
  );
}

export default App;
