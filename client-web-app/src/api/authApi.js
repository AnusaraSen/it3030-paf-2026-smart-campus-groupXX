const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const AUTH_SESSION_KEY = 'unicore.auth.session';
const AUTH_TOKEN_KEY = 'unicore.auth.token';
const AUTH_USER_KEY = 'unicore.auth.user';

async function requestJson(path, options = {}) {
  const { headers: requestHeaders = {}, ...requestOptions } = options;
  const hasRequestBody = typeof requestOptions.body !== 'undefined' && requestOptions.body !== null;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: {
      ...(hasRequestBody ? { 'Content-Type': 'application/json' } : {}),
      ...requestHeaders,
    },
  });

  const text = await response.text();
  const payload = text ? safeParseJson(text) : null;

  if (!response.ok) {
    const message = extractErrorMessage(payload, response.statusText || 'Request failed');
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return payload;
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractErrorMessage(payload, fallbackMessage) {
  if (!payload) {
    return fallbackMessage;
  }

  if (typeof payload === 'string') {
    return payload;
  }

  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message;
  }

  if (typeof payload.detail === 'string' && payload.detail.trim()) {
    return payload.detail;
  }

  if (typeof payload.title === 'string' && payload.title.trim()) {
    return payload.title;
  }

  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    const firstError = payload.errors[0];
    if (typeof firstError === 'string') {
      return firstError;
    }
    if (firstError && typeof firstError.message === 'string') {
      return firstError.message;
    }
  }

  return fallbackMessage;
}

export async function loginUser(credentials) {
  return requestJson('/api/users/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function registerUser(payload) {
  return requestJson('/api/users/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchAllUsers(token = '') {
  const resolvedToken = token || getAuthToken();

  if (!resolvedToken) {
    throw new Error('No access token available for the user list request.');
  }

  return requestJson('/api/users/all', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${resolvedToken}`,
    },
  });
}

export async function updateUserById(id, payload, token = '') {
  const resolvedToken = token || getAuthToken();

  if (!resolvedToken) {
    throw new Error('No access token available for the user update request.');
  }

  return requestJson(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    headers: {
      Authorization: `Bearer ${resolvedToken}`,
    },
  });
}

export async function deleteUserById(id, token = '') {
  const resolvedToken = token || getAuthToken();

  if (!resolvedToken) {
    throw new Error('No access token available for the user delete request.');
  }

  return requestJson(`/api/users/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${resolvedToken}`,
    },
  });
}

export function saveAuthSession(authResponse, remember = false) {
  const storage = remember ? window.localStorage : window.sessionStorage;
  const session = JSON.stringify(authResponse);

  storage.setItem(AUTH_SESSION_KEY, session);
  storage.setItem(AUTH_TOKEN_KEY, authResponse?.accessToken || '');
  storage.setItem(AUTH_USER_KEY, JSON.stringify(authResponse?.user || null));

  const otherStorage = remember ? window.sessionStorage : window.localStorage;
  otherStorage.removeItem(AUTH_SESSION_KEY);
  otherStorage.removeItem(AUTH_TOKEN_KEY);
  otherStorage.removeItem(AUTH_USER_KEY);
}

export function getAuthToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY) || window.sessionStorage.getItem(AUTH_TOKEN_KEY) || '';
}

export function getAuthSession() {
  const storedSession = window.localStorage.getItem(AUTH_SESSION_KEY) || window.sessionStorage.getItem(AUTH_SESSION_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    return JSON.parse(storedSession);
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  [window.localStorage, window.sessionStorage].forEach((storage) => {
    storage.removeItem(AUTH_SESSION_KEY);
    storage.removeItem(AUTH_TOKEN_KEY);
    storage.removeItem(AUTH_USER_KEY);
  });
}