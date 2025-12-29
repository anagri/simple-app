import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders counter with initial value 0', () => {
    render(<App />);
    const counterButton = screen.getByTestId('counter-button');
    expect(counterButton).toHaveTextContent('count is 0');
  });

  it('increments counter on click', async () => {
    const user = userEvent.setup();
    render(<App />);

    const counterButton = screen.getByTestId('counter-button');
    await user.click(counterButton);

    expect(counterButton).toHaveTextContent('count is 1');
  });
});
