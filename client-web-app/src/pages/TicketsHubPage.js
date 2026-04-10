import React from 'react';
import SiteHeader from '../components/shared/SiteHeader.jsx';
import { searchResources } from '../api/resourcesApi';
import { DEMO_RESOURCES } from './CreateTicketPage.js';

function normalizeResources(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  return [];
}

function getStatusTone(status) {
  if (status === 'ACTIVE') {
    return 'bg-emerald-100 text-emerald-700';
  }

  return 'bg-rose-100 text-rose-700';
}

export default function TicketsHubPage({
  onHome,
  onLogout,
  onOpenDashboard,
  onOpenTechnicianDashboard,
  onOpenBookings,
  onOpenTickets,
  onOpenResources,
  onRaiseTicket,
}) {
  const [resources, setResources] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let mounted = true;

    const loadResources = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await searchResources({});

        if (!mounted) {
          return;
        }

        const list = normalizeResources(data);
        setResources(list.length ? list : DEMO_RESOURCES);
      } catch (exception) {
        if (!mounted) {
          return;
        }

        setResources(DEMO_RESOURCES);
        setError(exception instanceof Error ? exception.message : 'Unable to load resources right now.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadResources();

    return () => {
      mounted = false;
    };
  }, []);

  const activeCount = resources.filter((resource) => resource.status === 'ACTIVE').length;

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
              <span className="mb-3 inline-block rounded-full border border-[#F17620]/20 bg-[#F17620]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F17620]">
                Ticket Center
              </span>
              <h1 className="font-headline text-3xl font-black tracking-tight">Maintenance & incident tickets</h1>
              <p className="mt-2 max-w-2xl text-sm font-medium text-[#272269]/70">
                Review campus resources, then raise a ticket directly from the resource card that needs attention.
              </p>
            </div>

            <div className="rounded-2xl border border-white/60 bg-white/70 px-5 py-4 text-right shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">Available Resources</p>
              <p className="mt-1 font-headline text-3xl font-black text-[#272269]">{resources.length}</p>
              <p className="text-xs font-semibold text-[#272269]/55">{activeCount} active</p>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800">
              Showing demo resources because the live catalogue could not be loaded.
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              className="uc-button uc-button--primary"
              onClick={() => onRaiseTicket?.(resources[0] || null)}
              disabled={!resources.length || loading}
            >
              Raise a ticket
            </button>
            <button
              type="button"
              className="uc-button uc-button--secondary"
              onClick={() => onOpenResources?.()}
            >
              Browse resources
            </button>
          </div>
        </section>

        <section className="mt-8 glass-panel rounded-3xl border border-white/50 p-6 shadow-xl shadow-[#272269]/5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-headline text-xl font-extrabold">Resource cards</h2>
            <div className="text-sm font-semibold text-[#272269]/60">{loading ? 'Loading resources...' : `${resources.length} resource(s)`}</div>
          </div>

          {loading ? (
            <div className="mt-4 rounded-2xl border border-white/60 bg-white/40 px-5 py-6 text-sm font-semibold text-[#272269]/60">
              Loading resources...
            </div>
          ) : resources.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-white/60 bg-white/40 px-5 py-6 text-sm font-semibold text-[#272269]/60">
              No resources available.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {resources.map((resource) => {
                return (
                  <article
                    key={resource.id}
                    className="flex flex-col rounded-3xl border border-white/60 bg-white/70 p-5 shadow-[0_18px_45px_rgba(39,34,105,0.08)] backdrop-blur-xl transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(39,34,105,0.12)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-headline text-xl font-black text-[#272269]">{resource.name}</h3>
                        <p className="mt-1 text-sm font-medium uppercase tracking-[0.2em] text-[#272269]/45">
                          {resource.type || 'RESOURCE'}
                        </p>
                      </div>
                      <span className={['rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest', getStatusTone(resource.status)].join(' ')}>
                        {resource.status || 'UNKNOWN'}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">Capacity</p>
                        <p className="mt-1 font-bold text-[#272269]">{resource.capacity ?? '—'}</p>
                      </div>
                      <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">Location</p>
                        <p className="mt-1 font-bold text-[#272269]">{resource.location || '—'}</p>
                      </div>
                    </div>

                    <div className="mt-5 flex-1 rounded-2xl border border-[#272269]/10 bg-[#272269]/5 px-4 py-4">
                      <p className="text-xs font-medium leading-6 text-[#272269]/60">
                        Open a ticket for this resource if it needs maintenance, support, or an incident follow-up.
                      </p>

                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => onRaiseTicket?.(resource)}
                          className="rounded-full bg-[#F57923] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white shadow-[0_10px_24px_rgba(245,121,35,0.28)] transition-transform hover:-translate-y-0.5 hover:bg-[#e66c14]"
                        >
                          Raise a ticket
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