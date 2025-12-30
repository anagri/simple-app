import './App.css';

function App() {
  const handleLogin = () => {
    // No-op handler - to be implemented
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Welcome</h1>
          <p className="mt-2 text-sm text-gray-600">Please sign in to continue</p>
        </div>
        <div className="mt-8">
          <button
            data-testid="login-button"
            onClick={handleLogin}
            className="group relative flex w-full justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:bg-blue-800"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
