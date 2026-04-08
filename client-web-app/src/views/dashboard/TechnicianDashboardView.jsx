import React from 'react';
import { Link } from 'react-router-dom';
import { getAuthSession } from '../../api/authApi';
import { useAuth } from '../../auth/AuthContext';
import { getStaffTickets } from '../../api/ticketsApi';
import AdminDashboardHeader from '../../components/admin-dashboard/AdminDashboardHeader.jsx';
import AdminDashboardFooter from '../../components/admin-dashboard/AdminDashboardFooter.jsx';
import { StatusBadge } from '../../components/StatusBadge';

function toList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.content)) return response.content;
  return [];
}

export default function TechnicianDashboardView({ onHome, onLogout }) {
  const authSession = getAuthSession();
  const currentUser = authSession?.user || null;
  const { authHeader } = useAuth();
  const [tickets, setTickets] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const isTechnician = currentUser?.role === 'TECHNICIAN';

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const result = await getStaffTickets({}, authHeader);
        if (mounted) {
          setTickets(toList(result));
        }
      } catch (e) {
        if (mounted) {
          setError(e?.message || 'Unable to load technician queue.');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [authHeader]);

  if (!currentUser || !authSession?.accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_0%_0%,#E0E7FF_0%,#faf9f9_100%)] px-6 text-center">
        <div className="glass-panel max-w-md rounded-3xl border border-white/50 p-8 shadow-xl">
          <h1 className="font-headline text-3xl font-black text-[#272269]">Session Required</h1>
          <p className="mt-3 text-sm text-[#272269]/70">Please sign in with a technician account.</p>
          <button className="uc-button uc-button--primary uc-button--large mt-6" type="button" onClick={onHome}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!isTechnician) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_0%_0%,#E0E7FF_0%,#faf9f9_100%)] px-6 text-center">
        <div className="glass-panel max-w-md rounded-3xl border border-white/50 p-8 shadow-xl">
          <h1 className="font-headline text-3xl font-black text-[#272269]">Access Restricted</h1>
          <p className="mt-3 text-sm text-[#272269]/70">This dashboard is only available to technicians.</p>
          <button className="uc-button uc-button--primary uc-button--large mt-6" type="button" onClick={onHome}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,#E0E7FF_0%,#faf9f9_100%)] px-5 pb-6 pt-8 text-[#272269]">
      <main className="relative mx-auto h-[calc(100vh-3rem)] max-w-7xl overflow-y-auto">
        <AdminDashboardHeader onHome={onHome} onLogout={onLogout} />

        <div className="space-y-8 px-4 pb-10 pt-16">
          <section className="glass-panel relative overflow-hidden rounded-3xl border border-white/50 p-10 shadow-xl shadow-[#272269]/5">
            <div className="absolute right-[-50px] top-[-50px] h-96 w-96 rounded-full bg-[#F17620] aura-glow" />
            <div className="absolute bottom-[-100px] left-[10%] h-64 w-64 rounded-full bg-[#272269] aura-glow" />
            <div className="relative z-10 flex flex-col items-end justify-between gap-8 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <span className="mb-4 inline-block rounded-full border border-[#F17620]/20 bg-[#F17620]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F17620]">
                  Technician Workspace
                </span>
                <h2 className="mb-4 font-headline text-5xl font-extrabold leading-none tracking-tighter text-[#272269]">
                  Technician <br />
                  <span className="text-[#F17620]">Operations Panel</span>
                </h2>
                <p className="max-w-lg font-medium text-[#272269]/70">
                  Review incoming tickets, prioritize incidents, and update ticket comments for campus users.
                </p>
              </div>
              <div className="min-w-[180px] rounded-2xl border border-white bg-white/50 p-6 text-center shadow-sm">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#272269]/50">Assigned Queue</p>
                <p className="font-headline text-3xl font-black text-[#272269]">{tickets.length}</p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <article className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/50">Open Tickets</p>
              <p className="mt-2 font-headline text-4xl font-black text-[#272269]">{openCount}</p>
            </article>
            <article className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/50">In Progress</p>
              <p className="mt-2 font-headline text-4xl font-black text-[#F17620]">{inProgressCount}</p>
            </article>
            <article className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/50">Resolved / Closed</p>
              <p className="mt-2 font-headline text-4xl font-black text-emerald-600">{resolvedCount}</p>
            </article>
          </section>

          <section className="glass-panel rounded-3xl border border-white/50 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="font-headline text-2xl font-black text-[#272269]">Ticket Queue</h3>
              <Link className="rounded-full bg-[#F17620] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white" to="/tickets/mine">
                Open Tickets Module
              </Link>
            </div>

            {error ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

            <div className="overflow-hidden rounded-2xl bg-white/70">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#272269]/40">
                    <th className="px-5 py-4">Ticket</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Priority</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td className="px-5 py-5 text-[#272269]/60" colSpan={5}>
                        Loading technician tickets...
                      </td>
                    </tr>
                  ) : tickets.length === 0 ? (
                    <tr>
                      <td className="px-5 py-5 text-[#272269]/60" colSpan={5}>
                        No tickets available right now.
                      </td>
                    </tr>
                  ) : (
                    tickets.map((ticket) => (
                      <tr key={ticket.id} className="border-t border-white/60 hover:bg-[#272269]/5">
                        <td className="px-5 py-4 font-medium text-[#272269]">#{ticket.id}</td>
                        <td className="px-5 py-4 text-[#272269]/80">{ticket.category}</td>
                        <td className="px-5 py-4 text-[#272269]/80">{ticket.priority}</td>
                        <td className="px-5 py-4">
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link className="text-xs font-bold uppercase tracking-widest text-[#F17620] hover:underline" to={`/tickets/${ticket.id}`}>
                            View & Comment
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <AdminDashboardFooter />
        </div>
      </main>
    </div>
  );
}
