import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getMyTickets, deleteTicket } from '../api/ticketsApi';
import { StatusBadge } from '../components/StatusBadge';

export function MyTicketsPage() {
  const { authHeader } = useAuth();
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 0 });
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const json = await getMyTickets(page, authHeader);
      setData({
        content: json.content || [],
        totalPages: json.totalPages ?? 1,
        totalElements: json.totalElements,
      });
    } catch (e) {
      setError(e.message || 'Could not load tickets.');
    }
  }, [authHeader, page]);

  useEffect(() => {
    load();
  }, [load]);

  const onDelete = async (id) => {
    if (!window.confirm('Delete this OPEN ticket?')) return;
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
            {data.content.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/80">
                <td className="px-4 py-3">{row.resourceName || `#${row.resourceId ?? '—'}`}</td>
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
                    <Link
                      to={`/tickets/${row.id}`}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-campus-primary hover:bg-orange-50"
                    >
                      Details
                    </Link>
                    {row.status === 'OPEN' ? (
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => onDelete(row.id)}
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
    </section>
  );
}
