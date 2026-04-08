import React, { useMemo, useState } from 'react';
import SiteHeader from '../../components/shared/SiteHeader.jsx';
import { searchResources } from '../../api/resourcesApi';

const RESOURCE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'LECTURE_HALL', label: 'Lecture Hall' },
  { value: 'LAB', label: 'Lab' },
  { value: 'MEETING_ROOM', label: 'Meeting Room' },
  { value: 'EQUIPMENT', label: 'Equipment' },
];

const RESOURCE_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'OUT_OF_SERVICE', label: 'Out of Service' },
];

function formatWindows(windows) {
  if (!Array.isArray(windows) || windows.length === 0) {
    return '—';
  }

  return windows
    .map((w) => {
      const day = String(w.dayOfWeek || '').slice(0, 3);
      const start = w.startTime || '';
      const end = w.endTime || '';
      return `${day} ${start}-${end}`.trim();
    })
    .join(', ');
}

export default function FacilitiesCatalogueView({
  onHome,
  onLogout,
  onOpenDashboard,
  onOpenBookings,
  onOpenTickets,
  onOpenResources,
}) {
  const [filters, setFilters] = useState({
    q: '',
    type: '',
    status: '',
    minCapacity: '',
    maxCapacity: '',
    location: '',
  });

  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [resources, setResources] = useState([]);

  const requestFilters = useMemo(() => {
    const minCapacity = filters.minCapacity === '' ? undefined : Number(filters.minCapacity);
    const maxCapacity = filters.maxCapacity === '' ? undefined : Number(filters.maxCapacity);

    return {
      q: filters.q,
      type: filters.type || undefined,
      status: filters.status || undefined,
      minCapacity: Number.isFinite(minCapacity) ? minCapacity : undefined,
      maxCapacity: Number.isFinite(maxCapacity) ? maxCapacity : undefined,
      location: filters.location,
    };
  }, [filters]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setStatus('loading');

    try {
      const data = await searchResources(requestFilters);
      setResources(Array.isArray(data) ? data : []);
      setStatus('success');
    } catch (error) {
      setResources([]);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load resources.');
    }
  };

  const handleReset = () => {
    setFilters({
      q: '',
      type: '',
      status: '',
      minCapacity: '',
      maxCapacity: '',
      location: '',
    });
    setResources([]);
    setStatus('idle');
    setErrorMessage('');
  };

  const isLoading = status === 'loading';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,#E0E7FF_0%,#faf9f9_100%)] px-5 pb-10 pt-8 text-[#272269]">
      <main className="mx-auto w-full max-w-6xl">
        <SiteHeader
          className="landing-nav--dashboard"
          onHome={onHome}
          onOpenDashboard={onOpenDashboard}
          onOpenBookings={onOpenBookings}
          onOpenTickets={onOpenTickets}
          onOpenResources={onOpenResources}
          onLogout={onLogout}
        />

        <section className="mt-8 glass-panel rounded-3xl border border-white/50 p-8 shadow-xl shadow-[#272269]/5">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-headline text-3xl font-black tracking-tight">Facilities & Assets Catalogue</h1>
              <p className="mt-2 text-sm font-medium text-[#272269]/70">
                Search and filter campus resources by type, status, capacity, and location.
              </p>
            </div>

            <div className="flex gap-3">
              <button className="uc-button uc-button--secondary" type="button" onClick={handleReset} disabled={isLoading}>
                Reset
              </button>
              <button className="uc-button uc-button--primary" type="submit" form="resource-search-form" disabled={isLoading}>
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          <form id="resource-search-form" className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-[#272269]/60" htmlFor="resource-q">
                Search
              </label>
              <input
                id="resource-q"
                name="q"
                value={filters.q}
                onChange={handleChange}
                placeholder="Name or location"
                className="w-full rounded-2xl border border-[#272269]/10 bg-white/60 px-4 py-3 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F17620]/20"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-[#272269]/60" htmlFor="resource-type">
                Type
              </label>
              <select
                id="resource-type"
                name="type"
                value={filters.type}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#272269]/10 bg-white/60 px-4 py-3 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F17620]/20"
              >
                {RESOURCE_TYPES.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-[#272269]/60" htmlFor="resource-status">
                Status
              </label>
              <select
                id="resource-status"
                name="status"
                value={filters.status}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#272269]/10 bg-white/60 px-4 py-3 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F17620]/20"
              >
                {RESOURCE_STATUSES.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-[#272269]/60" htmlFor="resource-minCapacity">
                Min Capacity
              </label>
              <input
                id="resource-minCapacity"
                name="minCapacity"
                value={filters.minCapacity}
                onChange={handleChange}
                type="number"
                min="1"
                placeholder="e.g., 10"
                className="w-full rounded-2xl border border-[#272269]/10 bg-white/60 px-4 py-3 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F17620]/20"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-[#272269]/60" htmlFor="resource-maxCapacity">
                Max Capacity
              </label>
              <input
                id="resource-maxCapacity"
                name="maxCapacity"
                value={filters.maxCapacity}
                onChange={handleChange}
                type="number"
                min="1"
                placeholder="e.g., 200"
                className="w-full rounded-2xl border border-[#272269]/10 bg-white/60 px-4 py-3 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F17620]/20"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-[#272269]/60" htmlFor="resource-location">
                Location
              </label>
              <input
                id="resource-location"
                name="location"
                value={filters.location}
                onChange={handleChange}
                placeholder="e.g., Building A"
                className="w-full rounded-2xl border border-[#272269]/10 bg-white/60 px-4 py-3 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F17620]/20"
              />
            </div>
          </form>

          {errorMessage ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
              {errorMessage}
            </div>
          ) : null}
        </section>

        <section className="mt-8 glass-panel rounded-3xl border border-white/50 p-6 shadow-xl shadow-[#272269]/5">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-xl font-extrabold">Results</h2>
            <div className="text-sm font-semibold text-[#272269]/60">{resources.length} resource(s)</div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-white/60 bg-white/40">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/60">
                <tr>
                  <th className="px-4 py-3 font-bold uppercase tracking-widest text-[11px] text-[#272269]/60">Name</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-widest text-[11px] text-[#272269]/60">Type</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-widest text-[11px] text-[#272269]/60">Capacity</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-widest text-[11px] text-[#272269]/60">Location</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-widest text-[11px] text-[#272269]/60">Status</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-widest text-[11px] text-[#272269]/60">Availability</th>
                </tr>
              </thead>
              <tbody>
                {resources.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-sm font-semibold text-[#272269]/60" colSpan={6}>
                      {status === 'idle'
                        ? 'Run a search to load resources.'
                        : status === 'loading'
                          ? 'Loading...'
                          : 'No matching resources found.'}
                    </td>
                  </tr>
                ) : (
                  resources.map((resource) => (
                    <tr key={resource.id} className="border-t border-white/60">
                      <td className="px-4 py-3 font-bold text-[#272269]">{resource.name}</td>
                      <td className="px-4 py-3 font-semibold text-[#272269]/70">{resource.type}</td>
                      <td className="px-4 py-3 font-semibold text-[#272269]/70">{resource.capacity}</td>
                      <td className="px-4 py-3 font-semibold text-[#272269]/70">{resource.location}</td>
                      <td className="px-4 py-3 font-semibold text-[#272269]/70">{resource.status}</td>
                      <td className="px-4 py-3 font-semibold text-[#272269]/70">
                        {formatWindows(resource.availabilityWindows)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
