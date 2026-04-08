import { API_BASE } from '../config';

export async function apiFetch(path, options = {}, authHeaderFn) {
  const headers = new Headers(options.headers || {});
  if (authHeaderFn) {
    headers.set('Authorization', authHeaderFn());
  }
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  return res;
}

export async function readErrorMessage(res) {
  try {
    const data = await res.json();
    return data.message || data.error || res.statusText;
  } catch {
    return res.statusText;
  }
}

export function absoluteUploadUrl(fileUrl) {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http')) return fileUrl;
  return `${API_BASE}${fileUrl}`;
}
