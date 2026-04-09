import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-indigo-100/80 bg-white p-8 shadow-lg shadow-indigo-950/5">
      <h1 className="text-3xl font-bold text-slate-800">Welcome</h1>
      <p className="mt-4 text-slate-600">
        Use the <strong className="text-campus-primary">Tickets</strong> button in the header to open maintenance
        and incident ticketing: report issues and view your own tickets.
      </p>
      <Link
        to="/tickets"
        className="mt-8 inline-flex rounded-full bg-campus-primary px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-campus-primary-hover"
      >
        Go to tickets
      </Link>
    </section>
  );
}
