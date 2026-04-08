import { Link, NavLink, Outlet } from 'react-router-dom';

const navClass = ({ isActive }) =>
  [
    'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
    isActive
      ? 'bg-campus-primary text-white shadow'
      : 'bg-white/80 text-slate-600 hover:bg-white hover:text-campus-primary',
  ].join(' ');

export function TicketsHubPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-2xl border border-indigo-100/80 bg-white p-6 shadow-lg shadow-indigo-950/5">
        <h1 className="text-2xl font-bold text-slate-800">Maintenance & incident tickets</h1>
        <p className="mt-2 text-slate-600">
          Report campus issues and track tickets you&apos;ve submitted.
        </p>
        <nav className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-6">
          <NavLink to="/tickets" end className={navClass}>
            Overview
          </NavLink>
          <NavLink to="/tickets/new" className={navClass}>
            New ticket
          </NavLink>
          <NavLink to="/tickets/mine" className={navClass}>
            My tickets
          </NavLink>
        </nav>
      </div>

      <Outlet />

      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 p-6 text-center text-sm text-slate-500">
        <p>
          Signed in as campus user (<code className="rounded bg-slate-100 px-1">user</code> /{' '}
          <code className="rounded bg-slate-100 px-1">password</code>) for API access.
        </p>
      </div>
    </div>
  );
}

export function TicketsOverview() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Link
        to="/tickets/new"
        className="group rounded-2xl border border-indigo-100 bg-white p-6 shadow-md transition hover:border-campus-primary hover:shadow-lg"
      >
        <h2 className="text-lg font-semibold text-slate-800 group-hover:text-campus-primary">Report an incident</h2>
        <p className="mt-2 text-sm text-slate-600">
          Open a new ticket with location, category, photos, and contact details.
        </p>
        <span className="mt-4 inline-flex items-center text-sm font-semibold text-campus-primary">
          Create ticket →
        </span>
      </Link>
      <Link
        to="/tickets/mine"
        className="group rounded-2xl border border-indigo-100 bg-white p-6 shadow-md transition hover:border-campus-primary hover:shadow-lg"
      >
        <h2 className="text-lg font-semibold text-slate-800 group-hover:text-campus-primary">My tickets</h2>
        <p className="mt-2 text-sm text-slate-600">View status, details, and comments on your requests.</p>
        <span className="mt-4 inline-flex items-center text-sm font-semibold text-campus-primary">
          View list →
        </span>
      </Link>
    </div>
  );
}
