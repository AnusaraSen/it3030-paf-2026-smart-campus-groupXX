import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const createJsonResponse = (payload) => ({
  ok: true,
  statusText: 'OK',
  text: async () => JSON.stringify(payload),
  json: async () => payload,
});

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

test('redirects unauthenticated users to login from tickets', async () => {
  render(<App />);

  await userEvent.click(within(screen.getByRole('banner')).getByRole('button', { name: /^tickets$/i }));

  expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
});

test('redirects unauthenticated users to login from resources', async () => {
  render(<App />);

  await userEvent.click(within(screen.getByRole('banner')).getByRole('button', { name: /^resources$/i }));

  expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
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

test('routes technician users to the technician dashboard', async () => {
  window.localStorage.setItem(
    'unicore.auth.session',
    JSON.stringify({
      accessToken: 'test-token',
      user: {
        firstName: 'Tech',
        lastName: 'User',
        role: 'TECHNICIAN',
      },
    }),
  );

  render(<App />);

  expect(screen.getByRole('button', { name: /tech user technician/i })).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /tech user technician/i }));
  await userEvent.click(screen.getByRole('menuitem', { name: /dashboard/i }));

  expect(screen.getByRole('heading', { name: /technician operations panel/i })).toBeInTheDocument();
});

test('opens the ticket hub and ticket form from the site header', async () => {
  window.history.pushState({}, '', '/technician/dashboard');
  window.localStorage.setItem(
    'unicore.auth.session',
    JSON.stringify({
      accessToken: 'test-token',
      user: {
        firstName: 'Tech',
        lastName: 'User',
        role: 'TECHNICIAN',
      },
    }),
  );

  const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
    createJsonResponse([
      {
        id: 11,
        name: 'Lab 101 Projector',
        type: 'EQUIPMENT',
        status: 'ACTIVE',
        capacity: 1,
        location: 'Science Block',
        availabilityWindows: [{ dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '17:00' }],
      },
    ]),
  );

  try {
    render(<App />);

    await userEvent.click(within(screen.getByRole('banner')).getByRole('button', { name: /tickets/i }));

    expect(await screen.findByRole('heading', { name: /maintenance & incident tickets/i })).toBeInTheDocument();
    await screen.findByRole('button', { name: /raise a ticket/i });

    await userEvent.click(screen.getAllByRole('button', { name: /raise a ticket/i })[0]);

    expect(await screen.findByRole('heading', { name: /report an incident/i })).toBeInTheDocument();
  } finally {
    fetchSpy.mockRestore();
  }
});

test('opens the admin tickets panel from the sidebar', async () => {
  window.history.pushState({}, '', '/admin/dashboard');
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

  expect(screen.getByRole('heading', { name: /administrator command center/i })).toBeInTheDocument();
  await userEvent.click(screen.getAllByRole('button', { name: /tickets/i })[0]);

  expect(screen.getByRole('heading', { name: /submitted user tickets/i })).toBeInTheDocument();
});
