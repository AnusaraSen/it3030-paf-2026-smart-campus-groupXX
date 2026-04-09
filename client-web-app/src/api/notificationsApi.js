import { apiFetch, readErrorMessage } from './client';
import { getAuthToken } from './authApi';

export async function getMyNotifications(token = '') {
  const resolvedToken = token || getAuthToken();

  if (!resolvedToken) {
    throw new Error('No access token available for the notifications request.');
  }

  const res = await apiFetch(
    '/api/notifications/me',
    { method: 'GET' },
    () => `Bearer ${resolvedToken}`,
  );

  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }

  return res.json();
}

export async function markAllNotificationsAsRead(token = '') {
  const resolvedToken = token || getAuthToken();

  if (!resolvedToken) {
    throw new Error('No access token available for the notifications request.');
  }

  const res = await apiFetch(
    '/api/notifications/me/read-all',
    { method: 'PATCH' },
    () => `Bearer ${resolvedToken}`,
  );

  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
}