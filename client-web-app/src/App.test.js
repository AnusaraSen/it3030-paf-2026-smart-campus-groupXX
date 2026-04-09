import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

afterEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.pushState({}, '', '/');
});

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

test('routes admin users to the dashboard', async () => {
  window.localStorage.setItem(
    'unicore.auth.session',
    JSON.stringify({
      accessToken: 'test-token',
      user: {
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
      },
    }),
  );

  render(<App />);

  expect(screen.getByRole('button', { name: /admin user admin/i })).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /admin user admin/i }));
  await userEvent.click(screen.getByRole('menuitem', { name: /dashboard/i }));

  expect(screen.getByRole('heading', { name: /administrator command center/i })).toBeInTheDocument();
});
