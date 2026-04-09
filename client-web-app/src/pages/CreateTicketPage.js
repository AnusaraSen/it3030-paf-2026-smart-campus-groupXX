import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { fetchResources, createTicket } from '../api/ticketsApi';

const CATEGORIES = ['ELECTRICAL', 'NETWORK', 'HARDWARE', 'OTHER'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const MAX_FILES = 3;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/gif'];

const DEMO_RESOURCES = [
  { id: 1, name: 'Demo — Lab 101 projector' },
  { id: 2, name: 'Demo — Library Wi‑Fi access point' },
  { id: 3, name: 'Demo — Annex electrical panel' },
];

function normalizeResources(data) {
  if (!data) return DEMO_RESOURCES;
  if (Array.isArray(data)) {
    return data.map((r) => ({
      id: r.id,
      name: r.name || r.resourceName || `Resource #${r.id}`,
    }));
  }
  if (Array.isArray(data.content)) {
    return normalizeResources(data.content);
  }
  return DEMO_RESOURCES;
}

const inputCls =
  'mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-slate-800 outline-none ring-campus-primary focus:ring-2';

export function CreateTicketPage() {
  const { authHeader } = useAuth();
  const [resources, setResources] = useState(DEMO_RESOURCES);
  const [resourceId, setResourceId] = useState(String(DEMO_RESOURCES[0].id));
  const [category, setCategory] = useState('ELECTRICAL');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [preferredContact, setPreferredContact] = useState('');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const raw = await fetchResources(authHeader);
      if (cancelled) return;
      const list = normalizeResources(raw);
      setResources(list);
      if (list.length) {
        setResourceId(String(list[0].id));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authHeader]);

  const onFiles = (e) => {
    setError('');
    const chosen = Array.from(e.target.files || []);
    const next = [];
    for (const f of chosen) {
      if (next.length >= MAX_FILES) break;
      if (!ALLOWED.includes(f.type)) {
        setError('Only JPG, PNG, or GIF images are allowed.');
        return;
      }
      if (f.size > MAX_BYTES) {
        setError('Each image must be 5 MB or smaller.');
        return;
      }
      next.push(f);
    }
    setFiles(next);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }
    if (description.length > 1000) {
      setError('Description must be at most 1000 characters.');
      return;
    }
    if (!preferredContact.trim()) {
      setError('Preferred contact is required.');
      return;
    }
    setSubmitting(true);
    try {
      await createTicket(
        {
          resourceId: Number(resourceId),
          category,
          description: description.trim(),
          priority,
          preferredContact: preferredContact.trim(),
        },
        files,
        authHeader
      );
      setSuccess('Ticket submitted successfully.');
      setDescription('');
      setPreferredContact('');
      setFiles([]);
    } catch (err) {
      setError(err.message || 'Failed to create ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-indigo-100/80 bg-white p-6 shadow-lg shadow-indigo-950/5">
      <h2 className="text-xl font-bold text-slate-800">Report an incident</h2>
      <p className="mt-2 text-sm text-slate-600">
        Describe the issue, choose the resource, and attach up to three images (5 MB each max).
      </p>

      <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={onSubmit}>
        <label className="block text-sm font-semibold text-slate-700 sm:col-span-1">
          Resource
          <select className={inputCls} value={resourceId} onChange={(e) => setResourceId(e.target.value)}>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs font-normal text-slate-500">
            From Module A when available; otherwise demo resources.
          </span>
        </label>

        <label className="block text-sm font-semibold text-slate-700 sm:col-span-1">
          Category
          <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
          Description (required, max 1000)
          <textarea
            className={`${inputCls} min-h-[120px] resize-y`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            placeholder="What happened? Where on campus?"
          />
          <span className="mt-1 block text-xs font-normal text-slate-500">{description.length} / 1000</span>
        </label>

        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-semibold text-slate-700">Priority</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRIORITIES.map((p) => (
              <label
                key={p}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${
                  priority === p
                    ? 'border-campus-primary bg-orange-50 text-campus-primary'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value={p}
                  checked={priority === p}
                  onChange={() => setPriority(p)}
                  className="sr-only"
                />
                {p}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
          Preferred contact (phone or email)
          <input
            type="text"
            className={inputCls}
            value={preferredContact}
            onChange={(e) => setPreferredContact(e.target.value)}
            maxLength={255}
            placeholder="+94… or name@example.com"
          />
        </label>

        <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
          Attachments
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif"
            multiple
            onChange={onFiles}
            className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-campus-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-campus-primary-hover"
          />
          <span className="mt-1 block text-xs text-slate-500">
            {files.length}/{MAX_FILES} file{files.length === 1 ? '' : 's'} — JPG, PNG, GIF only
          </span>
        </label>

        {error ? <p className="sm:col-span-2 text-sm font-medium text-red-700">{error}</p> : null}
        {success ? <p className="sm:col-span-2 text-sm font-medium text-emerald-700">{success}</p> : null}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-campus-primary px-8 py-3 text-sm font-bold text-white shadow-md transition hover:bg-campus-primary-hover disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit ticket'}
          </button>
        </div>
      </form>
    </section>
  );
}
