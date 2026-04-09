import { apiFetch, readErrorMessage } from './client';

const qs = (params) => {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      u.set(k, String(v));
    }
  });
  const s = u.toString();
  return s ? `?${s}` : '';
};

export async function fetchResources(authHeader) {
  const res = await apiFetch('/api/resources?status=ACTIVE', {}, authHeader);
  if (res.ok) {
    return res.json();
  }
  return null;
}

export async function createTicket(payload, files, authHeader) {
  const form = new FormData();
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  form.append('data', blob);
  (files || []).forEach((f) => form.append('files', f));
  const res = await apiFetch(
    '/api/tickets',
    { method: 'POST', body: form },
    authHeader
  );
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return res.json();
}

export async function getMyTickets(page, authHeader) {
  const res = await apiFetch(`/api/tickets/my${qs({ page, size: 10 })}`, {}, authHeader);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return res.json();
}

export async function getStaffTickets(filters, authHeader) {
  const res = await apiFetch(`/api/tickets${qs({ ...filters, size: 10 })}`, {}, authHeader);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return res.json();
}

export async function getTicket(id, authHeader) {
  const res = await apiFetch(`/api/tickets/${id}`, {}, authHeader);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return res.json();
}

export async function deleteTicket(id, authHeader) {
  const res = await apiFetch(`/api/tickets/${id}`, { method: 'DELETE' }, authHeader);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
}

export async function assignTechnician(ticketId, technicianId, authHeader) {
  const res = await apiFetch(
    `/api/tickets/${ticketId}/assign`,
    { method: 'PATCH', body: JSON.stringify({ technicianId }) },
    authHeader
  );
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return res.json();
}

export async function patchStatus(ticketId, body, authHeader) {
  const res = await apiFetch(
    `/api/tickets/${ticketId}/status`,
    { method: 'PATCH', body: JSON.stringify(body) },
    authHeader
  );
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return res.json();
}

export async function resolveTicket(ticketId, resolutionNotes, authHeader) {
  const res = await apiFetch(
    `/api/tickets/${ticketId}/resolve`,
    { method: 'PATCH', body: JSON.stringify({ resolutionNotes }) },
    authHeader
  );
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return res.json();
}

export async function postComment(ticketId, message, authHeader) {
  const res = await apiFetch(
    `/api/tickets/${ticketId}/comments`,
    { method: 'POST', body: JSON.stringify({ message }) },
    authHeader
  );
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return res.json();
}

export async function putComment(commentId, message, authHeader) {
  const res = await apiFetch(
    `/api/comments/${commentId}`,
    { method: 'PUT', body: JSON.stringify({ message }) },
    authHeader
  );
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return res.json();
}

export async function deleteComment(commentId, authHeader) {
  const res = await apiFetch(`/api/comments/${commentId}`, { method: 'DELETE' }, authHeader);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
}
