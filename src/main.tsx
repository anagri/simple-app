import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './auth';
import { authConfig, validateAuthConfig } from './config';

// Validate config (throws if invalid)
validateAuthConfig(authConfig);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider config={authConfig}>
      <App />
    </AuthProvider>
  </StrictMode>
);
