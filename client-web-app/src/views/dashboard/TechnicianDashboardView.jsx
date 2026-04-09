import React from 'react';
import { getAuthSession } from '../../api/authApi';
import { useAuth } from '../../auth/AuthContext';
import { fetchResources } from '../../api/ticketsApi';
import { getStaffTickets, getTicket, patchStatus } from '../../api/ticketsApi';
import { absoluteUploadUrl } from '../../api/client';
import AdminDashboardHeader from '../../components/admin-dashboard/AdminDashboardHeader.jsx';
import AdminDashboardFooter from '../../components/admin-dashboard/AdminDashboardFooter.jsx';
import { StatusBadge } from '../../components/StatusBadge';

function toList(response) {
  if (Array.isArray(response?.content)) return response.content;
  return [];
}

function buildResourceLookup(resources) {
  return (Array.isArray(resources) ? resources : []).reduce((lookup, resource) => {
    if (resource?.id != null) {
      lookup[String(resource.id)] = resource.name || resource.resourceName || `Resource #${resource.id}`;
    }
    return lookup;
  }, {});
}

function formatDisplayName(user) {
  if (!user) {
    return '';
  }

  const nameParts = [user.firstName, user.lastName].filter(Boolean).map((part) => String(part).trim()).filter(Boolean);
  if (nameParts.length > 0) {
    return nameParts.join(' ');
  }

  if (user.name && String(user.name).trim()) {
    return String(user.name).trim();
  }

  return user.email || '';
}

export default function TechnicianDashboardView({ onHome, onLogout, onOpenTickets, onOpenResources }) {
  const authSession = getAuthSession();
  const currentUser = authSession?.user || null;
  const { authHeader } = useAuth();
  const [tickets, setTickets] = React.useState([]);
  const [resourceLookup, setResourceLookup] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [selectedTicket, setSelectedTicket] = React.useState(null);
  const [isTicketDetailsLoading, setIsTicketDetailsLoading] = React.useState(false);
  const [ticketDetailsError, setTicketDetailsError] = React.useState('');
  const [statusBusyTicketId, setStatusBusyTicketId] = React.useState(null);

  const isTechnician = currentUser?.role === 'TECHNICIAN';

  const loadTickets = React.useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await getStaffTickets({}, authHeader);
      setTickets(toList(result));
    } catch (e) {
      setError(e?.message || 'Unable to load technician queue.');
    } finally {
      setIsLoading(false);
    }
  }, [authHeader]);

  const loadResources = React.useCallback(async () => {
    const result = await fetchResources(authHeader);
    setResourceLookup(buildResourceLookup(result));
  }, [authHeader]);

  React.useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        await Promise.all([loadTickets(), loadResources()]);
      } catch {
        if (mounted) {
          setResourceLookup({});
        }
      }
    };

    if (mounted) {
      run();
    }

    return () => {
      mounted = false;
    };
  }, [loadTickets]);

  const closeDetails = () => {
    setSelectedTicket(null);
    setTicketDetailsError('');
    setIsTicketDetailsLoading(false);
  };

  const openDetails = async (ticketId) => {
    setSelectedTicket({ id: ticketId });
    setIsTicketDetailsLoading(true);
    setTicketDetailsError('');

    try {
      const response = await getTicket(ticketId, authHeader);
      setSelectedTicket(response);
    } catch (exception) {
      setTicketDetailsError(exception instanceof Error ? exception.message : 'Unable to load ticket details.');
    } finally {
      setIsTicketDetailsLoading(false);
    }
  };

  const getNextStatus = (status) => {
    if (status === 'OPEN') {
      return 'IN_PROGRESS';
    }

    if (status === 'IN_PROGRESS') {
      return 'RESOLVED';
    }

    return null;
  };

  const changeStatus = async (ticket) => {
    const nextStatus = getNextStatus(ticket.status);

    if (!nextStatus) {
      window.alert('This ticket cannot be moved to the next status from its current state.');
      return;
    }

    const confirmed = window.confirm(`Change ticket #${ticket.id} from ${ticket.status} to ${nextStatus}?`);
    if (!confirmed) {
      return;
    }

    setStatusBusyTicketId(ticket.id);
    try {
      await patchStatus(ticket.id, { status: nextStatus }, authHeader);
      await loadTickets();
      setSelectedTicket((currentTicket) => (
        currentTicket && currentTicket.id === ticket.id
          ? { ...currentTicket, status: nextStatus }
          : currentTicket
      ));
    } catch (exception) {
      window.alert(exception instanceof Error ? exception.message : 'Unable to update ticket status.');
    } finally {
      setStatusBusyTicketId(null);
    }
  };

  const getResourceLabel = (ticket) => {
    if (!ticket) {
      return 'Unknown resource';
    }

    const lookupLabel = resourceLookup[String(ticket.resourceId)];
    return ticket.resourceName || lookupLabel || 'Unknown resource';
  };

  const getCreatedByLabel = (ticket) => {
    if (!ticket) {
      return 'Unknown user';
    }

    if (ticket.createdByName && String(ticket.createdByName).trim()) {
      return ticket.createdByName;
    }

    if (currentUser?.id != null && ticket.createdBy != null && String(ticket.createdBy) === String(currentUser.id)) {
      return formatDisplayName(currentUser) || currentUser.email || 'Unknown user';
    }

    if (ticket.preferredContact && String(ticket.preferredContact).trim()) {
      return ticket.preferredContact;
    }

    return 'Unknown user';
  };

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
        <AdminDashboardHeader onHome={onHome} onLogout={onLogout} onOpenTickets={onOpenTickets} onOpenResources={onOpenResources} />

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
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openDetails(ticket.id)}
                              className="rounded-lg border border-[#F17620]/20 bg-white px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#F17620] hover:bg-[#F17620]/5"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              disabled={statusBusyTicketId === ticket.id || getNextStatus(ticket.status) == null}
                              onClick={() => changeStatus(ticket)}
                              className="rounded-lg bg-[#F17620] px-3 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#e66c14] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {statusBusyTicketId === ticket.id
                                ? 'Updating...'
                                : getNextStatus(ticket.status) === 'IN_PROGRESS'
                                  ? 'Mark In Progress'
                                  : getNextStatus(ticket.status) === 'RESOLVED'
                                    ? 'Mark Resolved'
                                    : 'Change Status'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {selectedTicket ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172acc] px-4 py-6 backdrop-blur-lg">
              <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#272269]/40">Ticket Details</p>
                    <h3 className="mt-1 font-headline text-3xl font-black text-[#272269]">#{selectedTicket.id}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={closeDetails}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>

                <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.3fr_1fr]">
                  <section className="space-y-5">
                    {isTicketDetailsLoading ? (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                        Loading ticket details...
                      </div>
                    ) : ticketDetailsError ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {ticketDetailsError}
                      </div>
                    ) : (
                      <>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Resource</p>
                              <p className="mt-1 font-medium text-slate-800">{getResourceLabel(selectedTicket)}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Category</p>
                              <p className="mt-1 font-medium text-slate-800">{selectedTicket.category}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Priority</p>
                              <p className="mt-1 font-medium text-slate-800">{selectedTicket.priority}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Status</p>
                              <div className="mt-1"><StatusBadge status={selectedTicket.status} /></div>
                            </div>
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Preferred Contact</p>
                              <p className="mt-1 font-medium text-slate-800">{selectedTicket.preferredContact || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Submitted</p>
                              <p className="mt-1 font-medium text-slate-800">
                                {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString() : '—'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Created By</p>
                              <p className="mt-1 font-medium text-slate-800">{getCreatedByLabel(selectedTicket)}</p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Description</p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{selectedTicket.description}</p>
                          </div>
                          {selectedTicket.resolutionNotes ? (
                            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Resolution Notes</p>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-emerald-900">{selectedTicket.resolutionNotes}</p>
                            </div>
                          ) : null}
                          {selectedTicket.rejectionReason ? (
                            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4">
                              <p className="text-xs font-bold uppercase tracking-widest text-red-700">Rejection Reason</p>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-900">{selectedTicket.rejectionReason}</p>
                            </div>
                          ) : null}
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-white p-4">
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Attachments</p>
                          {selectedTicket.attachments?.length ? (
                            <div className="mt-3 space-y-2">
                              {selectedTicket.attachments.map((attachment) => (
                                <a
                                  key={attachment.id}
                                  href={absoluteUploadUrl(attachment.fileUrl)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block rounded-xl border border-slate-100 px-3 py-2 text-sm text-[#272269] hover:bg-slate-50"
                                >
                                  {attachment.originalName}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-slate-500">No attachments.</p>
                          )}
                        </div>
                      </>
                    )}
                  </section>

                  <aside className="space-y-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Comments</p>
                      {selectedTicket.comments?.length ? (
                        <div className="mt-3 space-y-3">
                          {selectedTicket.comments.map((comment) => (
                            <article key={comment.id} className="rounded-xl border border-slate-100 bg-white p-3">
                              <div className="text-xs text-slate-500">
                                User #{comment.userId} · {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : '—'}
                              </div>
                              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{comment.message}</p>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500">No comments yet.</p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-[#F17620]/15 bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-[#F17620]">Quick Status Action</p>
                      <p className="mt-2 text-sm text-slate-600">
                        {getNextStatus(selectedTicket.status)
                          ? `Move this ticket to ${getNextStatus(selectedTicket.status).replace('_', ' ')}.`
                          : 'This ticket is in a terminal status.'}
                      </p>
                      <button
                        type="button"
                        disabled={statusBusyTicketId === selectedTicket.id || getNextStatus(selectedTicket.status) == null}
                        onClick={() => changeStatus(selectedTicket)}
                        className="mt-4 w-full rounded-full bg-[#F17620] px-4 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#e66c14] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {statusBusyTicketId === selectedTicket.id
                          ? 'Updating...'
                          : getNextStatus(selectedTicket.status) === 'IN_PROGRESS'
                            ? 'Mark In Progress'
                            : getNextStatus(selectedTicket.status) === 'RESOLVED'
                              ? 'Mark Resolved'
                              : 'Change Status'}
                      </button>
                    </div>
                  </aside>
                </div>
              </div>
            </div>
          ) : null}

          <AdminDashboardFooter />
        </div>
      </main>
    </div>
  );
}
