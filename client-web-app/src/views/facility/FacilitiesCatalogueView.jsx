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

function getStatusTone(status) {
  if (status === 'ACTIVE') {
    return 'bg-emerald-100 text-emerald-700';
  }

  return 'bg-rose-100 text-rose-700';
}

function formatAvailabilityCards(windows) {
  if (!Array.isArray(windows) || windows.length === 0) {
    return ['No availability set'];
  }

  return windows.map((window) => {
    const day = String(window.dayOfWeek || '').slice(0, 3);
    const start = window.startTime || '';
    const end = window.endTime || '';
    return `${day} ${start}-${end}`.trim();
  });
}

export default function FacilitiesCatalogueView({
  onHome,
  onLogout,
  onOpenDashboard,
  onOpenBookings,
  onOpenTickets,
  onOpenResources,
  onOpenBookingForm,
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

  const loadResources = async (nextFilters = requestFilters) => {
    setErrorMessage('');
    setStatus('loading');

    try {
      const data = await searchResources(nextFilters);
      setResources(Array.isArray(data) ? data : []);
      setStatus('success');
    } catch (error) {
      setResources([]);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load resources.');
    }
  };

  const loadAllResources = async () => {
    await loadResources({});
  };

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
    await loadResources(requestFilters);
  };

  const handleReset = async () => {
    setFilters({
      q: '',
      type: '',
      status: '',
      minCapacity: '',
      maxCapacity: '',
      location: '',
    });
    setErrorMessage('');
    await loadAllResources();
  };

  React.useEffect(() => {
    loadAllResources();
  }, []);

  const isLoading = status === 'loading';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,#E0E7FF_0%,#faf9f9_100%)] px-5 pb-10 pt-8 text-[#272269]">
      <main className="mx-auto w-full max-w-6xl pt-10 md:pt-14">
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

          {status === 'loading' ? (
            <div className="mt-4 rounded-2xl border border-white/60 bg-white/40 px-5 py-6 text-sm font-semibold text-[#272269]/60">
              Loading resources...
            </div>
          ) : resources.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-white/60 bg-white/40 px-5 py-6 text-sm font-semibold text-[#272269]/60">
              {status === 'idle' ? 'No resources available yet.' : 'No matching resources found.'}
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {resources.map((resource) => {
                const availabilityCards = formatAvailabilityCards(resource.availabilityWindows);
                const isBookable = resource.status === 'ACTIVE' && Array.isArray(resource.availabilityWindows) && resource.availabilityWindows.length > 0;

                return (
                  <article
                    key={resource.id}
                    className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-[0_18px_45px_rgba(39,34,105,0.08)] backdrop-blur-xl transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(39,34,105,0.12)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-headline text-xl font-black text-[#272269]">{resource.name}</h3>
                        <p className="mt-1 text-sm font-medium uppercase tracking-[0.2em] text-[#272269]/45">
                          {resource.type}
                        </p>
                      </div>
                      <span className={['rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest', getStatusTone(resource.status)].join(' ')}>
                        {resource.status}
                      </span>
                    </div>

                    {resource.status !== 'ACTIVE' ? (
                      <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                        This resource is out of service and cannot be booked.
                      </div>
                    ) : null}

                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">Capacity</p>
                        <p className="mt-1 font-bold text-[#272269]">{resource.capacity}</p>
                      </div>
                      <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">Location</p>
                        <p className="mt-1 font-bold text-[#272269]">{resource.location}</p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-[#272269]/10 bg-[#272269]/5 px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#272269]/40">Availability</p>
                        <span className="text-xs font-semibold text-[#272269]/55">{availabilityCards.length} slot{availabilityCards.length === 1 ? '' : 's'}</span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {availabilityCards.map((entry) => (
                          <span
                            key={entry}
                            className="rounded-full border border-[#F17620]/15 bg-[#F17620]/10 px-3 py-1 text-[11px] font-bold tracking-widest text-[#F17620]"
                          >
                            {entry}
                          </span>
                        ))}
                      </div>

                      {resource.availabilityWindows?.length ? (
                        <p className="mt-3 text-xs text-[#272269]/55">{formatWindows(resource.availabilityWindows)}</p>
                      ) : null}

                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => onOpenBookingForm?.(resource)}
                          disabled={!isBookable}
                          className="rounded-full bg-[#F57923] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white shadow-[0_10px_24px_rgba(245,121,35,0.28)] transition-transform hover:-translate-y-0.5 hover:bg-[#e66c14] disabled:cursor-not-allowed disabled:bg-[#F57923]/40 disabled:shadow-none"
                        >
                          {isBookable ? 'Book Resource' : 'Unavailable'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
