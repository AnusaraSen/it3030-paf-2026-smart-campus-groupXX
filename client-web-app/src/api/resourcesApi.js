import { getAuthToken } from './authApi';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_BASE || 'http://localhost:8080';

async function requestJson(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
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
  if (!payload) return fallbackMessage;
  if (typeof payload === 'string') return payload;
  if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;
  if (typeof payload.detail === 'string' && payload.detail.trim()) return payload.detail;
  if (typeof payload.title === 'string' && payload.title.trim()) return payload.title;

  if (payload.errors && typeof payload.errors === 'object') {
    const firstKey = Object.keys(payload.errors)[0];
    const firstValue = firstKey ? payload.errors[firstKey] : null;
    if (typeof firstValue === 'string') return firstValue;
    if (Array.isArray(firstValue) && typeof firstValue[0] === 'string') return firstValue[0];
  }

  return fallbackMessage;
}

function buildQuery(params) {
  const searchParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'string' && value.trim() === '') return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export function searchResources(filters) {
  const query = buildQuery(filters);
  return requestJson(`/api/resources${query}`, { method: 'GET' });
}

export function getResourceById(id) {
  return requestJson(`/api/resources/${id}`, { method: 'GET' });
}

export function createResource(payload) {
  return requestJson('/api/resources', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateResource(id, payload) {
  return requestJson(`/api/resources/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteResource(id) {
  return requestJson(`/api/resources/${id}`, { method: 'DELETE' });
}
