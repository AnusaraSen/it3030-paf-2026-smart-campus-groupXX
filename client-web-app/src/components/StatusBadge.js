const styles = {
  OPEN: 'bg-blue-100 text-blue-900',
  IN_PROGRESS: 'bg-amber-100 text-amber-900',
  RESOLVED: 'bg-emerald-100 text-emerald-900',
  CLOSED: 'bg-slate-200 text-slate-800',
  REJECTED: 'bg-red-100 text-red-900',
};

function label(status) {
  return status ? String(status).replace(/_/g, ' ') : '—';
}

export function StatusBadge({ status }) {
  const cls = styles[status] || 'bg-slate-100 text-slate-700';
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold capitalize tracking-wide ${cls}`}
    >
      {label(status)}
    </span>
  );
}
