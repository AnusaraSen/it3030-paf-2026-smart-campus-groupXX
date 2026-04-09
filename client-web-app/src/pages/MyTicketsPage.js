import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { fetchResources, getMyTickets, deleteTicket, getTicket, updateTicket } from '../api/ticketsApi';
import { StatusBadge } from '../components/StatusBadge';

const CATEGORIES = ['ELECTRICAL', 'NETWORK', 'HARDWARE', 'OTHER'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

function normalizeResources(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  return [];
}

function buildResourceLookup(resources) {
  return normalizeResources(resources).reduce((lookup, resource) => {
    if (resource?.id != null) {
      lookup[String(resource.id)] = resource.name || resource.resourceName || `Resource #${resource.id}`;
    }
    return lookup;
  }, {});
}

function mergeTicketDetails(summaryTicket, detailTicket) {
  if (!detailTicket) {
    return summaryTicket;
  }

  return {
    ...summaryTicket,
    ...detailTicket,
    resourceId: detailTicket.resourceId ?? summaryTicket.resourceId,
    resourceName: detailTicket.resourceName || summaryTicket.resourceName,
    createdBy: detailTicket.createdBy ?? summaryTicket.createdBy,
    createdByName: detailTicket.createdByName || summaryTicket.createdByName,
    assignedTechnicianId: detailTicket.assignedTechnicianId ?? summaryTicket.assignedTechnicianId,
    assignedTechnicianName: detailTicket.assignedTechnicianName || summaryTicket.assignedTechnicianName,
  };
}

function getEditableTicketDraft(ticket) {
  return {
    resourceId: ticket?.resourceId ? String(ticket.resourceId) : '',
    category: ticket?.category || 'ELECTRICAL',
    priority: ticket?.priority || 'MEDIUM',
    description: ticket?.description || '',
    preferredContact: ticket?.preferredContact || '',
  };
}

export function MyTicketsPage() {
  const { authHeader } = useAuth();
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 0 });
  const [resources, setResources] = useState([]);
  const [resourceLookup, setResourceLookup] = useState({});
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTicket, setEditingTicket] = useState(null);
  const [deleteTicketTarget, setDeleteTicketTarget] = useState(null);
  const [editForm, setEditForm] = useState(getEditableTicketDraft(null));
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingTicket, setDeletingTicket] = useState(false);

  const load = useCallback(async () => {
    setError('');
    setIsLoading(true);
    try {
      const [json, resourceJson] = await Promise.all([
        getMyTickets(page, authHeader),
        fetchResources(authHeader).catch(() => null),
      ]);

      const ticketRows = json.content || [];
      const detailedRows = await Promise.all(
        ticketRows.map((row) => getTicket(row.id, authHeader).catch(() => null)),
      );

      const mergedRows = ticketRows.map((row, index) => mergeTicketDetails(row, detailedRows[index]));
      const normalizedResources = normalizeResources(resourceJson);

      setResources(normalizedResources);
      setResourceLookup(buildResourceLookup(normalizedResources));
      setData({
        content: mergedRows,
        totalPages: json.totalPages ?? 1,
        totalElements: json.totalElements,
      });
    } catch (e) {
      setError(e.message || 'Could not load tickets.');
    } finally {
      setIsLoading(false);
    }
  }, [authHeader, page]);

  useEffect(() => {
    load();
  }, [load]);

  const onDelete = async (id) => {
    setBusyId(id);
    try {
      await deleteTicket(id, authHeader);
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const openDeleteConfirm = (ticket) => {
    setDeleteTicketTarget(ticket);
  };

  const closeDeleteConfirm = () => {
    setDeleteTicketTarget(null);
    setDeletingTicket(false);
  };

  const confirmDelete = async () => {
    if (!deleteTicketTarget) {
      return;
    }

    setDeletingTicket(true);
    try {
      await onDelete(deleteTicketTarget.id);
      closeDeleteConfirm();
    } catch {
      setDeletingTicket(false);
    }
  };

  const openEdit = (ticket) => {
    setEditError('');
    setEditingTicket(ticket);
    setEditForm(getEditableTicketDraft(ticket));
  };

  const closeEdit = () => {
    setEditingTicket(null);
    setEditForm(getEditableTicketDraft(null));
    setEditError('');
    setSavingEdit(false);
  };

  const submitEdit = async (event) => {
    event.preventDefault();

    if (!editingTicket) {
      return;
    }

    if (!editForm.resourceId) {
      setEditError('Resource is required.');
      return;
    }

    if (!editForm.description.trim()) {
      setEditError('Description is required.');
      return;
    }

    setSavingEdit(true);
    setEditError('');

    try {
      await updateTicket(
        editingTicket.id,
        {
          resourceId: Number(editForm.resourceId),
          category: editForm.category,
          description: editForm.description.trim(),
          priority: editForm.priority,
          preferredContact: editForm.preferredContact.trim(),
        },
        authHeader,
      );

      closeEdit();
      await load();
    } catch (exception) {
      setEditError(exception instanceof Error ? exception.message : 'Unable to update ticket.');
    } finally {
      setSavingEdit(false);
    }
  };

  const resourceOptions = useMemo(() => {
    const options = [...resources];

    if (editingTicket?.resourceId != null && !options.some((resource) => String(resource.id) === String(editingTicket.resourceId))) {
      options.unshift({
        id: editingTicket.resourceId,
        name: editingTicket.resourceName || resourceLookup[String(editingTicket.resourceId)] || `Resource #${editingTicket.resourceId}`,
      });
    }

    return options;
  }, [editingTicket, resourceLookup, resources]);

  const getResourceLabel = (row) => row.resourceName || resourceLookup[String(row.resourceId)] || 'Unknown resource';

  return (
    <section className="rounded-2xl border border-indigo-100/80 bg-white p-6 shadow-lg shadow-indigo-950/5">
      <h2 className="text-xl font-bold text-slate-800">My tickets</h2>
      {error ? <p className="mt-3 text-sm font-medium text-red-700">{error}</p> : null}

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100">
        <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Resource</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={6}>Loading tickets...</td>
              </tr>
            ) : data.content.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/80">
                <td className="px-4 py-3">{getResourceLabel(row)}</td>
                <td className="px-4 py-3">{row.category}</td>
                <td className="px-4 py-3">{row.priority}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                  {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    {row.status === 'OPEN' ? (
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-campus-primary hover:bg-orange-50"
                      >
                        Edit
                      </button>
                    ) : null}
                    {row.status === 'OPEN' ? (
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => openDeleteConfirm(row)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.content.length === 0 && !error ? (
        <p className="mt-6 text-center text-sm text-slate-500">No tickets yet.</p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          disabled={page <= 0}
          onClick={() => setPage((p) => p - 1)}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-sm text-slate-500">
          Page {page + 1}
          {data.totalElements != null ? ` · ${data.totalElements} total` : ''}
        </span>
        <button
          type="button"
          disabled={page + 1 >= (data.totalPages || 1)}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
        >
          Next
        </button>
      </div>

      {editingTicket ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0f172acc] px-4 py-6 backdrop-blur-2xl">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#272269]/40">Edit Ticket</p>
                <h3 className="mt-1 font-headline text-3xl font-black text-[#272269]">#{editingTicket.id}</h3>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <form className="space-y-4 px-6 py-6" onSubmit={submitEdit}>
              {editError ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{editError}</div> : null}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-600">
                  <span>Resource</span>
                  <select
                    value={editForm.resourceId}
                    onChange={(event) => setEditForm((current) => ({ ...current, resourceId: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-[#F17620]/20"
                  >
                    <option value="">Select resource</option>
                    {resourceOptions.map((resource) => (
                      <option key={resource.id} value={resource.id}>
                        {resource.name || `Resource #${resource.id}`}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm font-medium text-slate-600">
                  <span>Category</span>
                  <select
                    value={editForm.category}
                    onChange={(event) => setEditForm((current) => ({ ...current, category: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-[#F17620]/20"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm font-medium text-slate-600">
                  <span>Priority</span>
                  <select
                    value={editForm.priority}
                    onChange={(event) => setEditForm((current) => ({ ...current, priority: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-[#F17620]/20"
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm font-medium text-slate-600">
                  <span>Preferred Contact</span>
                  <input
                    type="email"
                    value={editForm.preferredContact}
                    onChange={(event) => setEditForm((current) => ({ ...current, preferredContact: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-[#F17620]/20"
                  />
                </label>
              </div>

              <label className="block space-y-2 text-sm font-medium text-slate-600">
                <span>Description</span>
                <textarea
                  rows={5}
                  value={editForm.description}
                  onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-[#F17620]/20"
                />
              </label>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-lg bg-[#F17620] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e66c14] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      ) : null}

      {deleteTicketTarget ? createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#0f172acc] px-4 py-6 backdrop-blur-2xl">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-6 py-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#272269]/40">Confirm Delete</p>
              <h3 className="mt-1 font-headline text-3xl font-black text-[#272269]">#{deleteTicketTarget.id}</h3>
            </div>

            <div className="space-y-4 px-6 py-6">
              <p className="text-sm leading-6 text-slate-600">
                Delete this open ticket? This action cannot be undone.
              </p>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">{getResourceLabel(deleteTicketTarget)}</div>
                <div className="mt-1">{deleteTicketTarget.category} · {deleteTicketTarget.priority}</div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeDeleteConfirm}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deletingTicket}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingTicket ? 'Deleting...' : 'Delete Ticket'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </section>
  );
}
