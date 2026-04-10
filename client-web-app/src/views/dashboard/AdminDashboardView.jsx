import React from 'react';
import { fetchAllUsers, getAuthSession } from '../../api/authApi';
import { getAllBookings } from '../../api/bookingApi';
import { searchResources } from '../../api/resourcesApi';
import { getStaffTickets } from '../../api/ticketsApi';
import { useAuth } from '../../auth/AuthContext';
import AdminBookingPanel from '../booking/AdminBookingPanel.jsx';
import AdminSidebar from '../../components/admin-dashboard/AdminSidebar.jsx';
import MetricCard from '../../components/admin-dashboard/MetricCard.jsx';
import ChartsPanel from '../../components/admin-dashboard/ChartsPanel.jsx';
import AdminDashboardFooter from '../../components/admin-dashboard/AdminDashboardFooter.jsx';
import AdminDashboardHeader from '../../components/admin-dashboard/AdminDashboardHeader.jsx';
import ResourceManagementPanel from '../../components/admin-dashboard/ResourceManagementPanel.jsx';
import UserManagementPanel from '../../components/admin-dashboard/UserManagementPanel.jsx';
import AdminTicketsPanel from '../../components/admin-dashboard/AdminTicketsPanel.jsx';

function buildUserGrowthSeries(users, months = 6) {
  const series = [];
  const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
  const now = new Date();

  for (let index = months - 1; index >= 0; index -= 1) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
    const value = users.filter((user) => {
      if (!user.createdAt) {
        return false;
      }

      const createdAt = new Date(user.createdAt);
      return createdAt >= monthStart && createdAt < monthEnd;
    }).length;

    series.push({
      label: monthFormatter.format(monthStart),
      value,
    });
  }

  return series;
}

function buildDailyUserGrowthSeries(users, days = 30) {
  const series = [];
  const dayFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  const now = new Date();

  for (let index = days - 1; index >= 0; index -= 1) {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - index);
    dayStart.setHours(0, 0, 0, 0);

    const nextDay = new Date(dayStart);
    nextDay.setDate(nextDay.getDate() + 1);

    const value = users.filter((user) => {
      if (!user.createdAt) {
        return false;
      }

      const createdAt = new Date(user.createdAt);
      return createdAt >= dayStart && createdAt < nextDay;
    }).length;

    series.push({
      key: dayStart.toISOString(),
      label: dayFormatter.format(dayStart),
      value,
    });
  }

  return series;
}

function buildRoleDistribution(users) {
  const counts = users.reduce((accumulator, user) => {
    const rawRole = String(user?.role || 'USERS').toUpperCase();
    const normalizedRole = rawRole === 'USER' ? 'USERS' : rawRole;
    accumulator[normalizedRole] = (accumulator[normalizedRole] || 0) + 1;
    return accumulator;
  }, {});

  return [
    { key: 'ADMIN', label: 'Admins', count: counts.ADMIN || 0, color: '#272269' },
    { key: 'TECHNICIAN', label: 'Technicians', count: counts.TECHNICIAN || 0, color: '#F17620' },
    { key: 'USERS', label: 'Users', count: counts.USERS || 0, color: '#10B981' },
  ];
}

export default function AdminDashboardView({ onHome, onLogout, onOpenDashboard, onOpenBookings, onOpenTickets, onOpenResources }) {
  const authSession = getAuthSession();
  const currentUser = authSession?.user || null;
  const isAdmin = currentUser?.role === 'ADMIN';
  const { authHeader } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState('dashboard');
  const [dashboardUsers, setDashboardUsers] = React.useState([]);
  const [isDashboardUsersLoading, setIsDashboardUsersLoading] = React.useState(true);
  const [dashboardUsersError, setDashboardUsersError] = React.useState('');
  const [dashboardTotals, setDashboardTotals] = React.useState({
    bookings: 0,
    tickets: 0,
    resources: 0,
  });
  const [isDashboardTotalsLoading, setIsDashboardTotalsLoading] = React.useState(true);
  const [dashboardTotalsError, setDashboardTotalsError] = React.useState('');
  const contentRef = React.useRef(null);

  const handleLogout = React.useCallback(() => {
    onLogout?.();
  }, [onLogout]);

  React.useEffect(() => {
    if (typeof contentRef.current?.scrollTo === 'function') {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeSection]);

  React.useEffect(() => {
    let isActive = true;

    const loadDashboardUsers = async () => {
      setIsDashboardUsersLoading(true);
      setDashboardUsersError('');

      try {
        const response = await fetchAllUsers(authSession?.accessToken || '');

        if (!isActive) {
          return;
        }

        setDashboardUsers(Array.isArray(response) ? response : []);
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (error?.status === 401 || error?.status === 403) {
          handleLogout();
          return;
        }

        setDashboardUsers([]);
        setDashboardUsersError(error instanceof Error ? error.message : 'Failed to load dashboard user metrics.');
      } finally {
        if (isActive) {
          setIsDashboardUsersLoading(false);
        }
      }
    };

    loadDashboardUsers();

    return () => {
      isActive = false;
    };
  }, [authSession?.accessToken, handleLogout]);

  React.useEffect(() => {
    let isActive = true;

    const loadDashboardTotals = async () => {
      setIsDashboardTotalsLoading(true);
      setDashboardTotalsError('');

      try {
        const [bookingsResponse, ticketsResponse, resourcesResponse] = await Promise.all([
          getAllBookings(),
          getStaffTickets({}, authHeader),
          searchResources({}),
        ]);

        if (!isActive) {
          return;
        }

        setDashboardTotals({
          bookings: bookingsResponse?.data?.totalElements ?? 0,
          tickets: ticketsResponse?.totalElements ?? 0,
          resources: Array.isArray(resourcesResponse) ? resourcesResponse.length : 0,
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (error?.status === 401 || error?.status === 403) {
          handleLogout();
          return;
        }

        setDashboardTotals({ bookings: 0, tickets: 0, resources: 0 });
        setDashboardTotalsError(error instanceof Error ? error.message : 'Failed to load dashboard totals.');
      } finally {
        if (isActive) {
          setIsDashboardTotalsLoading(false);
        }
      }
    };

    loadDashboardTotals();

    return () => {
      isActive = false;
    };
  }, [authHeader, handleLogout]);

  const totalUsers = dashboardUsers.length;
  const monthlyUserGrowthSeries = React.useMemo(() => buildUserGrowthSeries(dashboardUsers, 6), [dashboardUsers]);
  const dailyUserGrowthSeries = React.useMemo(() => buildDailyUserGrowthSeries(dashboardUsers, 30), [dashboardUsers]);
  const roleDistribution = React.useMemo(() => buildRoleDistribution(dashboardUsers), [dashboardUsers]);
  const dashboardTotalUsersValue = dashboardUsersError ? '—' : isDashboardUsersLoading ? '...' : totalUsers.toLocaleString('en-US');
  const dashboardBookingsValue = dashboardTotalsError ? '—' : isDashboardTotalsLoading ? '...' : dashboardTotals.bookings.toLocaleString('en-US');
  const dashboardTicketsValue = dashboardTotalsError ? '—' : isDashboardTotalsLoading ? '...' : dashboardTotals.tickets.toLocaleString('en-US');
  const dashboardResourcesValue = dashboardTotalsError ? '—' : isDashboardTotalsLoading ? '...' : dashboardTotals.resources.toLocaleString('en-US');

  if (!currentUser || !authSession?.accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_0%_0%,#E0E7FF_0%,#faf9f9_100%)] px-6 text-center">
        <div className="glass-panel max-w-md rounded-3xl border border-white/50 p-8 shadow-xl">
          <h1 className="font-headline text-3xl font-black text-[#272269]">Session Required</h1>
          <p className="mt-3 text-sm text-[#272269]/70">Please sign in with an administrator account to open the dashboard.</p>
          <button className="uc-button uc-button--primary uc-button--large mt-6" type="button" onClick={onHome}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_0%_0%,#E0E7FF_0%,#faf9f9_100%)] px-6 text-center">
        <div className="glass-panel max-w-md rounded-3xl border border-white/50 p-8 shadow-xl">
          <h1 className="font-headline text-3xl font-black text-[#272269]">Access Restricted</h1>
          <p className="mt-3 text-sm text-[#272269]/70">This dashboard is only available to administrators.</p>
          <button className="uc-button uc-button--primary uc-button--large mt-6" type="button" onClick={onHome}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen gap-2 bg-[radial-gradient(circle_at_0%_0%,#E0E7FF_0%,#faf9f9_100%)] px-5 pb-6 pt-8 text-[#272269]">
      <AdminSidebar
        collapsed={isSidebarCollapsed}
        activeSection={activeSection}
        onHome={onHome}
        onNavigateSection={setActiveSection}
        onLogout={handleLogout}
        onToggleCollapse={() => setIsSidebarCollapsed((currentValue) => !currentValue)}
      />

      <main ref={contentRef} className="relative flex h-[calc(100vh-3rem)] min-w-0 flex-1 flex-col overflow-y-auto">
        <AdminDashboardHeader
          onHome={onHome}
          onOpenDashboard={onOpenDashboard}
          onOpenBookings={onOpenBookings}
          onOpenTickets={onOpenTickets}
          onOpenResources={onOpenResources}
          onLogout={handleLogout}
          notificationTypePrefixes={['TICKET_', 'BOOKING_']}
          notificationHeading="Admin Notifications"
        />

        <div className="space-y-10 px-4 pb-10 pt-16">
          {activeSection === 'dashboard' ? (
            <>
              <section className="glass-panel relative overflow-hidden rounded-3xl border border-white/50 p-12 shadow-xl shadow-[#272269]/5">
                <div className="absolute right-[-50px] top-[-50px] h-96 w-96 rounded-full bg-[#F17620] aura-glow" />
                <div className="absolute bottom-[-100px] left-[10%] h-64 w-64 rounded-full bg-[#272269] aura-glow" />
                <div className="relative z-10 flex flex-col items-end justify-between gap-8 md:flex-row md:items-end">
                  <div className="max-w-2xl">
                    <span className="mb-4 inline-block rounded-full border border-[#F17620]/20 bg-[#F17620]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F17620]">
                      System Status: Optimal
                    </span>
                    <h2 className="mb-4 font-headline text-5xl font-extrabold leading-none tracking-tighter text-[#272269]">
                      Administrator <br />
                      <span className="text-[#F17620]">Command Center</span>
                    </h2>
                    <p className="max-w-lg font-medium text-[#272269]/70">
                      Centralized operational intelligence for UniCore Hub. Monitor infrastructure health, financial distribution, and user engagement across all university faculties.
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <div className="min-w-[140px] rounded-2xl border border-white bg-white/50 p-6 text-center shadow-sm">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#272269]/50">Live Ops</p>
                      <p className="font-headline text-3xl font-black text-[#272269]">1,402</p>
                    </div>
                    <div className="min-w-[140px] rounded-2xl border border-white bg-white/50 p-6 text-center shadow-sm">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#272269]/50">Queue</p>
                      <p className="font-headline text-3xl font-black text-[#F17620]">24ms</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard icon="groups" title="Total Users" value={dashboardTotalUsersValue} trend={dashboardUsersError ? undefined : isDashboardUsersLoading ? 'Loading' : 'Live'} />
                <MetricCard icon="event_available" title="Total Bookings" value={dashboardBookingsValue} accentClassName="bg-[#F17620]/10 text-[#F17620]" trend={dashboardTotalsError ? undefined : isDashboardTotalsLoading ? 'Loading' : 'Live'} />
                <MetricCard icon="confirmation_number" title="Total Tickets" value={dashboardTicketsValue} trend={dashboardTotalsError ? undefined : isDashboardTotalsLoading ? 'Loading' : 'Live'} />
                <MetricCard icon="inventory_2" title="Total Resources" value={dashboardResourcesValue} accentClassName="bg-emerald-50 text-emerald-600" trend={dashboardTotalsError ? undefined : isDashboardTotalsLoading ? 'Loading' : 'Live'} />
              </section>

              <ChartsPanel
                monthlyUserGrowthSeries={monthlyUserGrowthSeries}
                dailyUserGrowthSeries={dailyUserGrowthSeries}
                roleDistribution={roleDistribution}
                dataError={dashboardUsersError}
              />
            </>
          ) : activeSection === 'bookings' ? (
            <AdminBookingPanel />
          ) : activeSection === 'tickets' ? (
            <AdminTicketsPanel onSessionExpired={handleLogout} />
          ) : activeSection === 'resources' ? (
            <ResourceManagementPanel onSessionExpired={handleLogout} />
          ) : (
            <UserManagementPanel onSessionExpired={handleLogout} />
          )}

          <AdminDashboardFooter />
        </div>
      </main>
    </div>
  );
}