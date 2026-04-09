import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { getAuthSession } from '../api/authApi';
import { useAuth } from '../auth/AuthContext';
import { fetchResources, createTicket } from '../api/ticketsApi';

const CATEGORIES = ['ELECTRICAL', 'NETWORK', 'HARDWARE', 'OTHER'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const MAX_FILES = 3;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/gif'];

export const DEMO_RESOURCES = [
  { id: 1, name: 'Demo — Lab 101 projector' },
  { id: 2, name: 'Demo — Library Wi‑Fi access point' },
  { id: 3, name: 'Demo — Annex electrical panel' },
];

function normalizeResources(data) {
  if (!data) return DEMO_RESOURCES;

  if (Array.isArray(data)) {
    return data.map((resource) => ({
      id: resource.id,
      name: resource.name || resource.resourceName || `Resource #${resource.id}`,
    }));
  }

  if (Array.isArray(data.content)) {
    return normalizeResources(data.content);
  }

  return DEMO_RESOURCES;
}

function getResourceLabel(resource) {
  if (!resource) {
    return '';
  }

  return resource.name || resource.resourceName || `Resource #${resource.id}`;
}

const inputCls =
  'mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-slate-800 outline-none ring-campus-primary focus:ring-2';

export function CreateTicketPage({ resource, resourceId, onClose, onSuccess, modal = false } = {}) {
  const { authHeader } = useAuth();
  const initialResourceId = resource?.id ?? resourceId ?? '';
  const currentUserEmail = getAuthSession()?.user?.email || '';
  const [resources, setResources] = useState(() => {
    if (resource?.id) {
      return [{ id: resource.id, name: getResourceLabel(resource) }, ...DEMO_RESOURCES.filter((item) => String(item.id) !== String(resource.id))];
    }

    return DEMO_RESOURCES;
  });
  const [selectedResourceId, setSelectedResourceId] = useState(String(initialResourceId || DEMO_RESOURCES[0].id));
  const [category, setCategory] = useState('ELECTRICAL');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [preferredContact, setPreferredContact] = useState(currentUserEmail);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!preferredContact && currentUserEmail) {
      setPreferredContact(currentUserEmail);
    }
  }, [currentUserEmail, preferredContact]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const raw = await fetchResources(authHeader);

        if (cancelled) {
          return;
        }

        const fetchedResources = normalizeResources(raw);
        const selectedResource = resource?.id ? { id: resource.id, name: getResourceLabel(resource) } : null;
        const mergedResources = selectedResource
          ? [selectedResource, ...fetchedResources.filter((item) => String(item.id) !== String(selectedResource.id))]
          : fetchedResources;
        const nextResources = mergedResources.length ? mergedResources : (selectedResource ? [selectedResource] : DEMO_RESOURCES);

        setResources(nextResources);

        if (selectedResource) {
          setSelectedResourceId(String(selectedResource.id));
        } else {
          setSelectedResourceId((currentValue) => {
            if (nextResources.some((item) => String(item.id) === String(currentValue))) {
              return currentValue;
            }

            return nextResources.length ? String(nextResources[0].id) : currentValue;
          });
        }
      } catch {
        if (cancelled) {
          return;
        }

        const fallbackResources = resource?.id
          ? [{ id: resource.id, name: getResourceLabel(resource) }, ...DEMO_RESOURCES.filter((item) => String(item.id) !== String(resource.id))]
          : DEMO_RESOURCES;

        setResources(fallbackResources);
        if (resource?.id) {
          setSelectedResourceId(String(resource.id));
        } else if (fallbackResources.length) {
          setSelectedResourceId(String(fallbackResources[0].id));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authHeader, resource?.id, resource?.name, resource?.resourceName]);

  const onFiles = (event) => {
    setError('');
    const chosenFiles = Array.from(event.target.files || []);
    const nextFiles = [];

    for (const file of chosenFiles) {
      if (nextFiles.length >= MAX_FILES) {
        break;
      }

      if (!ALLOWED.includes(file.type)) {
        setError('Only JPG, PNG, or GIF images are allowed.');
        return;
      }

      if (file.size > MAX_BYTES) {
        setError('Each image must be 5 MB or smaller.');
        return;
      }

      nextFiles.push(file);
    }

    setFiles(nextFiles);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
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
          resourceId: Number(selectedResourceId),
          category,
          description: description.trim(),
          priority,
          preferredContact: preferredContact.trim(),
        },
        files,
        authHeader,
      );

      setSuccess('Ticket submitted successfully.');
      setDescription('');
      setPreferredContact('');
      setFiles([]);

      if (onSuccess) {
        window.setTimeout(() => {
          onSuccess();
          onClose?.();
        }, 1200);
      }
    } catch (exception) {
      setError(exception.message || 'Failed to create ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const formContent = (
    <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_30px_80px_rgba(39,34,105,0.14)]">
      <div className="h-2 bg-gradient-to-r from-[#F17620] via-[#ffb36d] to-[#272269]" />

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.5fr)_22rem]">
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-headline text-3xl font-black tracking-tight text-[#272269]">Report an incident</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#272269]/65">
                Choose the resource, describe the problem, and add any supporting images. Keep it short, clear, and location-specific.
              </p>
            </div>

            <div className="rounded-2xl border border-[#272269]/10 bg-[#272269]/5 px-4 py-3 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#272269]/40">Selected Resource</p>
              <p className="mt-1 text-sm font-bold text-[#272269]">
                {resources.find((item) => String(item.id) === String(selectedResourceId))?.name || 'Resource'}
              </p>
            </div>
          </div>

          <form className="mt-8 space-y-6" onSubmit={onSubmit}>
            <section className="rounded-3xl border border-[#272269]/10 bg-[#fafbff] p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#272269]/40">Step 1</p>
                  <h3 className="font-semibold text-[#272269]">Issue details</h3>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#F17620] shadow-sm">
                  Required
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Resource
                  <select className={inputCls} value={selectedResourceId} onChange={(event) => setSelectedResourceId(event.target.value)}>
                    {resources.map((resourceOption) => (
                      <option key={resourceOption.id} value={resourceOption.id}>
                        {resourceOption.name}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    From Module A when available; otherwise demo resources.
                  </span>
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Category
                  <select className={inputCls} value={category} onChange={(event) => setCategory(event.target.value)}>
                    {CATEGORIES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
                  Description
                  <textarea
                    className={`${inputCls} min-h-[150px] resize-y`}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    maxLength={1000}
                    placeholder="What happened? Where on campus?"
                  />
                  <span className="mt-1 block text-xs font-normal text-slate-500">{description.length} / 1000</span>
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-[#272269]/10 bg-white p-5 sm:p-6">
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#272269]/40">Step 2</p>
                <h3 className="font-semibold text-[#272269]">Priority and contact</h3>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <fieldset>
                  <legend className="text-sm font-semibold text-slate-700">Priority</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {PRIORITIES.map((option) => (
                      <label
                        key={option}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                          priority === option
                            ? 'border-campus-primary bg-orange-50 text-campus-primary shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="priority"
                          value={option}
                          checked={priority === option}
                          onChange={() => setPriority(option)}
                          className="sr-only"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <label className="block text-sm font-semibold text-slate-700">
                  Preferred contact
                  <input
                    type="text"
                    className={inputCls}
                    value={preferredContact}
                    onChange={(event) => setPreferredContact(event.target.value)}
                    maxLength={255}
                    placeholder="+94… or name@example.com"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-[#272269]/10 bg-[#fafbff] p-5 sm:p-6">
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#272269]/40">Step 3</p>
                <h3 className="font-semibold text-[#272269]">Attachments</h3>
              </div>

              <label className="block text-sm font-semibold text-slate-700">
                Add images
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  multiple
                  onChange={onFiles}
                  className="mt-2 block w-full rounded-2xl border border-dashed border-[#272269]/20 bg-white/80 px-4 py-3 text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-campus-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-campus-primary-hover"
                />
                <span className="mt-2 block text-xs text-slate-500">
                  {files.length}/{MAX_FILES} file{files.length === 1 ? '' : 's'} selected. JPG, PNG, GIF only.
                </span>
              </label>
            </section>

            {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
            {success ? <p className="text-sm font-medium text-emerald-700">{success}</p> : null}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-xs text-[#272269]/55">Keep the description concise. The support team will respond using the contact you provide.</p>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-campus-primary px-8 py-3 text-sm font-bold text-white shadow-md transition hover:bg-campus-primary-hover disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : 'Submit ticket'}
              </button>
            </div>
          </form>
        </div>

        <aside className="border-t border-[#272269]/10 bg-gradient-to-b from-[#272269]/5 to-[#F17620]/5 p-6 sm:p-8 lg:border-l lg:border-t-0">
          <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-[0_16px_38px_rgba(39,34,105,0.08)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#272269]/40">Before you submit</p>
            <h3 className="mt-2 text-lg font-black text-[#272269]">A few details help support move faster</h3>

            <ul className="mt-4 space-y-3 text-sm text-[#272269]/70">
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#F17620]" />
                Include the exact room, floor, or asset name if you know it.
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#272269]" />
                Add one clear photo of the issue when possible.
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Choose the best contact method so the team can reply quickly.
              </li>
            </ul>

            <div className="mt-6 rounded-2xl border border-[#272269]/10 bg-[#272269]/5 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#272269]/40">Selected resource</p>
              <p className="mt-1 text-sm font-semibold text-[#272269]">
                {resources.find((item) => String(item.id) === String(selectedResourceId))?.name || 'Resource'}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );

  if (!modal || !onClose) {
    return formContent;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/55 px-4 py-24 backdrop-blur-3xl backdrop-saturate-150"
      onClick={onClose}
      role="presentation"
    >
      <div className="relative z-[10000] w-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full border border-[#272269]/10 bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#272269] shadow-lg hover:bg-white"
        >
          Close
        </button>
        {formContent}
      </div>
    </div>,
    document.body,
  );
}

export default CreateTicketPage;