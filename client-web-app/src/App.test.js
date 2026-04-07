import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('renders landing page and navigates to auth views', async () => {
  render(<App />);

  expect(
    screen.getByRole('heading', { name: /orchestrating academic excellence through precision operations/i }),
  ).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /^login$/i }));
  expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /create an account/i }));
  expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
});
