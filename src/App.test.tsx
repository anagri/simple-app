import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders login screen with welcome message', () => {
    render(<App />);
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Please sign in to continue')).toBeInTheDocument();
  });

  it('renders login button', () => {
    render(<App />);
    const loginButton = screen.getByTestId('login-button');
    expect(loginButton).toBeInTheDocument();
    expect(loginButton).toHaveTextContent('Login');
  });

  it('login button is clickable', async () => {
    const user = userEvent.setup();
    render(<App />);

    const loginButton = screen.getByTestId('login-button');
    await user.click(loginButton);

    // Button should still be present (no-op handler)
    expect(loginButton).toBeInTheDocument();
  });
});
