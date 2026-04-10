import React from 'react';
import { fetchAllUsers, getAuthSession } from '../../api/authApi';
import { useAuth } from '../../auth/AuthContext';
import { assignTechnician, fetchResources, getStaffTickets, getTicket } from '../../api/ticketsApi';
import { StatusBadge } from '../../components/StatusBadge';

function toTicketList(response) {
  if (Array.isArray(response?.content)) {
    return response.content;
  }

  return [];
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString();
}

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
  return (Array.isArray(resources) ? resources : []).reduce((lookup, resource) => {
    if (resource?.id != null) {
      lookup[String(resource.id)] = resource.name || resource.resourceName || `Resource #${resource.id}`;
    }
    return lookup;
  }, {});
}

function buildUserLookup(users) {
  return (Array.isArray(users) ? users : []).reduce((lookup, user) => {
    if (user?.id != null) {
      const nameParts = [user.firstName, user.lastName].filter(Boolean).map((part) => String(part).trim()).filter(Boolean);
      const displayName = nameParts.length > 0
        ? nameParts.join(' ')
        : (user.name && String(user.name).trim()) || user.email || `User #${user.id}`;
      lookup[String(user.id)] = displayName;
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

function formatTechnicianLabel(technician, fallbackId) {
  if (!technician && fallbackId == null) {
    return 'Unassigned';
  }

  if (!technician) {
    return `Technician #${fallbackId}`;
  }

  const parts = [technician.firstName, technician.lastName].filter(Boolean);
  const name = parts.join(' ').trim();

  if (name) {
    return name;
  }

  return technician.email || `Technician #${fallbackId}`;
}

function formatUserLabel(name, fallbackId) {
  if (name && String(name).trim()) {
    return name;
  }

  if (fallbackId == null) {
    return 'Unknown';
  }

  return `User #${fallbackId}`;
}

export default function AdminTicketsPanel({ onSessionExpired } = {}) {
  const authSession = getAuthSession();
  const currentUser = authSession?.user || null;
  const { authHeader } = useAuth();
  const [tickets, setTickets] = React.useState([]);
  const [technicians, setTechnicians] = React.useState([]);
  const [resourceLookup, setResourceLookup] = React.useState({});
  const [userLookup, setUserLookup] = React.useState({});
  const [technicianSelections, setTechnicianSelections] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAssigningTicketId, setIsAssigningTicketId] = React.useState(null);
  const [error, setError] = React.useState('');
  const [actionMessage, setActionMessage] = React.useState('');

  const isAdmin = currentUser?.role === 'ADMIN';

  const refreshTickets = React.useCallback(async () => {
    const result = await getStaffTickets({}, authHeader);
    const summaryTickets = toTicketList(result);
    const detailTickets = await Promise.all(
      summaryTickets.map((ticket) => getTicket(ticket.id, authHeader).catch(() => null)),
    );
    setTickets(summaryTickets.map((ticket, index) => mergeTicketDetails(ticket, detailTickets[index])));
  }, [authHeader]);

  const loadReferenceData = React.useCallback(async () => {
    const [usersResponse, resourcesResponse] = await Promise.all([
      fetchAllUsers(authSession?.accessToken || ''),
      fetchResources(authHeader),
    ]);

    const allUsers = Array.isArray(usersResponse) ? usersResponse : [];
    setUserLookup(buildUserLookup(allUsers));
    setTechnicians(allUsers.filter((user) => user.role === 'TECHNICIAN'));
    setResourceLookup(buildResourceLookup(normalizeResources(resourcesResponse)));
  }, [authHeader, authSession?.accessToken]);

  React.useEffect(() => {
    let mounted = true;

    const loadTickets = async () => {
      setIsLoading(true);
      setError('');
      setActionMessage('');

      try {
        const [ticketResult] = await Promise.all([
          getStaffTickets({}, authHeader),
          loadReferenceData().catch((exception) => {
            if (exception?.status === 401 || exception?.status === 403) {
              throw exception;
            }
            setTechnicians([]);
            setUserLookup({});
            setResourceLookup({});
            return null;
          }),
        ]);

        if (!mounted) {
          return;
        }

        const ticketList = toTicketList(ticketResult);
        const detailTickets = await Promise.all(
          ticketList.map((ticket) => getTicket(ticket.id, authHeader).catch(() => null)),
        );
        setTickets(ticketList.map((ticket, index) => mergeTicketDetails(ticket, detailTickets[index])));
        setTechnicianSelections((currentSelections) => {
          const nextSelections = { ...currentSelections };
          ticketList.forEach((ticket) => {
            if (!nextSelections[ticket.id]) {
              nextSelections[ticket.id] = ticket.assignedTechnicianId != null
                ? String(ticket.assignedTechnicianId)
                : '';
            }
          });
          return nextSelections;
        });
      } catch (exception) {
        if (!mounted) {
          return;
        }

        if (exception?.status === 401 || exception?.status === 403) {
          onSessionExpired?.();
          return;
        }

        setTickets([]);
        setError(exception instanceof Error ? exception.message : 'Failed to load tickets.');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadTickets();

    return () => {
      mounted = false;
    };
  }, [authHeader, loadReferenceData, onSessionExpired]);

  const handleAssign = async (ticketId) => {
    const selectedTechnicianId = technicianSelections[ticketId];

    if (!selectedTechnicianId) {
      setActionMessage('Select a technician before assigning the ticket.');
      return;
    }

    setIsAssigningTicketId(ticketId);
    setActionMessage('');

    try {
      const updatedTicket = await assignTechnician(ticketId, Number(selectedTechnicianId), authHeader);
      if (updatedTicket) {
        setTickets((currentTickets) => currentTickets.map((ticket) => {
          if (String(ticket.id) !== String(ticketId)) {
            return ticket;
          }

          return {
            ...mergeTicketDetails(ticket, updatedTicket),
            assignedTechnicianId: updatedTicket.assignedTechnicianId ?? Number(selectedTechnicianId),
            assignedTechnicianName:
              updatedTicket.assignedTechnicianName || userLookup[String(selectedTechnicianId)] || ticket.assignedTechnicianName,
            resourceName:
              updatedTicket.resourceName || ticket.resourceName || resourceLookup[String(ticket.resourceId)] || '—',
            createdByName:
              updatedTicket.createdByName || ticket.createdByName || userLookup[String(ticket.createdBy)] || 'Unknown',
            status: updatedTicket.status || ticket.status,
          };
        }));
      }
      setActionMessage(`Ticket #${ticketId} assigned successfully.`);
      await refreshTickets();
    } catch (exception) {
      if (exception?.status === 401 || exception?.status === 403) {
        onSessionExpired?.();
        return;
      }

      setActionMessage(exception instanceof Error ? exception.message : 'Failed to assign ticket.');
    } finally {
      setIsAssigningTicketId(null);
    }
  };

  const getResourceLabel = (ticket) => ticket?.resourceName || resourceLookup[String(ticket?.resourceId)] || '—';

  const getCreatedByLabel = (ticket) => ticket?.createdByName || userLookup[String(ticket?.createdBy)] || 'Unknown';

  const getAssignedTechnicianLabel = (ticket) => {
    if (!ticket?.assignedTechnicianId) {
      return 'Unassigned';
    }

    return ticket.assignedTechnicianName || userLookup[String(ticket.assignedTechnicianId)] || `Technician #${ticket.assignedTechnicianId}`;
  };

  if (!currentUser || !authSession?.accessToken) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 text-center">
        <div className="glass-panel max-w-md rounded-3xl border border-white/50 p-8 shadow-xl">
          <h1 className="font-headline text-3xl font-black text-[#272269]">Session Required</h1>
          <p className="mt-3 text-sm text-[#272269]/70">Please sign in with an administrator account to view tickets.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 text-center">
        <div className="glass-panel max-w-md rounded-3xl border border-white/50 p-8 shadow-xl">
          <h1 className="font-headline text-3xl font-black text-[#272269]">Access Restricted</h1>
          <p className="mt-3 text-sm text-[#272269]/70">This ticket dashboard is only available to administrators.</p>
        </div>
      </div>
    );
  }

  const openCount = tickets.filter((ticket) => ticket.status === 'OPEN').length;
  const inProgressCount = tickets.filter((ticket) => ticket.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter((ticket) => ticket.status === 'RESOLVED' || ticket.status === 'CLOSED').length;

  return (
    <section className="space-y-6">
      <section className="glass-panel relative overflow-hidden rounded-3xl border border-white/50 p-10 shadow-xl shadow-[#272269]/5">
        <div className="absolute right-[-50px] top-[-50px] h-96 w-96 rounded-full bg-[#F17620] aura-glow" />
        <div className="absolute bottom-[-100px] left-[10%] h-64 w-64 rounded-full bg-[#272269] aura-glow" />
        <div className="relative z-10 flex flex-col items-end justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="mb-4 inline-block rounded-full border border-[#F17620]/20 bg-[#F17620]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F17620]">
              Ticket Oversight
            </span>
            <h2 className="mb-4 font-headline text-5xl font-extrabold leading-none tracking-tighter text-[#272269]">
              Submitted <br />
              <span className="text-[#F17620]">User Tickets</span>
            </h2>
            <p className="max-w-lg font-medium text-[#272269]/70">
              Review tickets submitted by campus users, monitor queue status, and keep the support workflow moving.
            </p>
          </div>

          <div className="min-w-[180px] rounded-2xl border border-white bg-white/50 p-6 text-center shadow-sm">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#272269]/50">Visible Tickets</p>
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
          <h3 className="font-headline text-2xl font-black text-[#272269]">Submitted Tickets</h3>
          <span className="rounded-full border border-[#272269]/10 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#272269]/60">
            Live Queue
          </span>
        </div>

        {error ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <div className="max-h-[32rem] overflow-auto rounded-2xl bg-white/70">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="sticky top-0 z-10 bg-white/95 text-[10px] font-bold uppercase tracking-[0.2em] text-[#272269]/40 backdrop-blur">
                <th className="px-5 py-4">Ticket</th>
                <th className="px-5 py-4">Resource</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Priority</th>
                <th className="px-5 py-4">Assigned Technician</th>
                <th className="px-5 py-4">Created By</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Submitted</th>
                <th className="px-5 py-4 text-right">Assign</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-5 py-5 text-[#272269]/60" colSpan={9}>
                    Loading submitted tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td className="px-5 py-5 text-[#272269]/60" colSpan={9}>
                    No tickets have been submitted yet.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-t border-white/60 hover:bg-[#272269]/5">
                    <td className="px-5 py-4 font-medium text-[#272269]">#{ticket.id}</td>
                    <td className="px-5 py-4 text-[#272269]/80">{getResourceLabel(ticket)}</td>
                    <td className="px-5 py-4 text-[#272269]/80">{ticket.category}</td>
                    <td className="px-5 py-4 text-[#272269]/80">{ticket.priority}</td>
                    <td className="px-5 py-4 text-[#272269]/80">
                      {getAssignedTechnicianLabel(ticket)}
                    </td>
                    <td className="px-5 py-4 text-[#272269]/80">
                      {getCreatedByLabel(ticket)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-5 py-4 text-[#272269]/70">{formatDate(ticket.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <select
                          className="min-w-[11rem] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-[#F17620]/20"
                          value={technicianSelections[ticket.id] || ''}
                          onChange={(event) => setTechnicianSelections((currentSelections) => ({
                            ...currentSelections,
                            [ticket.id]: event.target.value,
                          }))}
                        >
                          <option value="">Select technician</option>
                          {technicians.map((technician) => (
                            <option key={technician.id} value={technician.id}>
                              {formatTechnicianLabel(technician, technician.id)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={isAssigningTicketId === ticket.id || technicians.length === 0}
                          onClick={() => handleAssign(ticket.id)}
                          className="rounded-lg bg-[#F17620] px-3 py-2 text-xs font-semibold text-white hover:bg-[#e66c14] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isAssigningTicketId === ticket.id ? 'Assigning...' : 'Assign'}
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

        {actionMessage ? <p className="mt-4 text-sm font-medium text-[#272269]/70">{actionMessage}</p> : null}
    </section>
  );
}