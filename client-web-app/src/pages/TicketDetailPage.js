import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getTicket, postComment, putComment, deleteComment } from '../api/ticketsApi';
import { absoluteUploadUrl } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';

/** Matches backend stub until JWT exposes real user id */
const DEMO_USER_ID = 1;

const panelCls = 'rounded-xl border border-slate-100 bg-slate-50/50 p-4';

export function TicketDetailPage() {
  const { id } = useParams();
  const { authHeader } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const t = await getTicket(id, authHeader);
      setTicket(t);
    } catch (e) {
      setError(e.message || 'Could not load ticket.');
    }
  }, [authHeader, id]);

  useEffect(() => {
    load();
  }, [load]);

  const onAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      await postComment(id, comment.trim(), authHeader);
      setComment('');
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditText(c.message);
  };

  const saveEdit = async () => {
    try {
      await putComment(editingId, editText.trim(), authHeader);
      setEditingId(null);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const onDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteComment(commentId, authHeader);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  if (error && !ticket) {
    return (
      <section className="rounded-2xl border border-red-100 bg-white p-6 shadow">
        <p className="text-sm font-medium text-red-700">{error}</p>
        <Link to="/tickets/mine" className="mt-4 inline-block text-sm font-semibold text-campus-primary">
          Back to my tickets
        </Link>
      </section>
    );
  }

  if (!ticket) {
    return (
      <section className="rounded-2xl border border-indigo-100 bg-white p-8 text-center text-slate-500 shadow">
        Loading…
      </section>
    );
  }

  const timeline = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  const statusOrder = timeline.indexOf(ticket.status) >= 0 ? timeline.indexOf(ticket.status) : -1;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-indigo-100/80 bg-white p-6 shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Ticket #{ticket.id}</h2>
          <div className="mt-2">
            <StatusBadge status={ticket.status} />
          </div>
        </div>
        <Link
          to="/tickets/mine"
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Back to list
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className={panelCls}>
          <h3 className="font-semibold text-slate-800">Details</h3>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
            <dt className="text-slate-500">Resource</dt>
            <dd className="font-medium text-slate-800">{ticket.resourceName || `#${ticket.resourceId}`}</dd>
            <dt className="text-slate-500">Category</dt>
            <dd>{ticket.category}</dd>
            <dt className="text-slate-500">Priority</dt>
            <dd>{ticket.priority}</dd>
            <dt className="text-slate-500">Contact</dt>
            <dd>{ticket.preferredContact}</dd>
            <dt className="text-slate-500">Description</dt>
            <dd className="col-span-2 whitespace-pre-wrap text-slate-700">{ticket.description}</dd>
            {ticket.resolutionNotes ? (
              <>
                <dt className="text-slate-500">Resolution</dt>
                <dd className="col-span-2 whitespace-pre-wrap">{ticket.resolutionNotes}</dd>
              </>
            ) : null}
            {ticket.rejectionReason ? (
              <>
                <dt className="text-slate-500">Rejection</dt>
                <dd className="col-span-2 whitespace-pre-wrap text-red-800">{ticket.rejectionReason}</dd>
              </>
            ) : null}
            <dt className="text-slate-500">Reported</dt>
            <dd>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '—'}</dd>
          </dl>
        </article>

        <article className={panelCls}>
          <h3 className="font-semibold text-slate-800">Status timeline</h3>
          {ticket.status === 'REJECTED' ? (
            <p className="mt-3 text-sm text-slate-600">This ticket was rejected.</p>
          ) : (
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-600">
              {timeline.map((s, i) => (
                <li
                  key={s}
                  className={
                    i < statusOrder
                      ? 'font-medium text-emerald-800'
                      : i === statusOrder
                        ? 'font-bold text-campus-primary'
                        : ''
                  }
                >
                  {s.replace(/_/g, ' ')}
                </li>
              ))}
            </ol>
          )}
        </article>
      </div>

      {ticket.attachments?.length ? (
        <article className={panelCls}>
          <h3 className="font-semibold text-slate-800">Attachments</h3>
          <div className="mt-3 flex flex-wrap gap-3">
            {ticket.attachments.map((a) => (
              <a
                key={a.id}
                href={absoluteUploadUrl(a.fileUrl)}
                target="_blank"
                rel="noreferrer"
                className="overflow-hidden rounded-lg border border-slate-200 shadow-sm"
              >
                <img
                  src={absoluteUploadUrl(a.fileUrl)}
                  alt={a.originalName}
                  className="h-24 w-24 object-cover transition hover:opacity-90"
                />
              </a>
            ))}
          </div>
        </article>
      ) : null}

      <article className={`${panelCls} bg-white`}>
        <h3 className="font-semibold text-slate-800">Comments</h3>
        <ul className="mt-3 divide-y divide-slate-100">
          {(ticket.comments || []).map((c) => (
            <li key={c.id} className="py-3">
              <div className="text-xs text-slate-500">
                User #{c.userId} · {c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
              </div>
              {editingId === c.id ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    rows={3}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    maxLength={500}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-campus-primary focus:ring-2"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={saveEdit}
                      className="rounded-lg bg-campus-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-campus-primary-hover"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{c.message}</p>
                  {c.userId === DEMO_USER_ID ? (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(c)}
                        className="text-xs font-semibold text-campus-primary hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteComment(c.id)}
                        className="text-xs font-semibold text-red-700 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </li>
          ))}
        </ul>

        <form className="mt-6 border-t border-slate-100 pt-4" onSubmit={onAddComment}>
          <label className="block text-sm font-semibold text-slate-700">
            Add comment (max 500)
            <textarea
              rows={3}
              maxLength={500}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-campus-primary focus:ring-2"
            />
          </label>
          <button
            type="submit"
            disabled={!comment.trim()}
            className="mt-3 rounded-full bg-campus-primary px-6 py-2 text-sm font-bold text-white hover:bg-campus-primary-hover disabled:opacity-50"
          >
            Post comment
          </button>
        </form>
      </article>
    </section>
  );
}
