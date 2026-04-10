import { useState, useEffect } from 'react';
import MetricCard from '../../components/admin-dashboard/MetricCard.jsx';
import {
  getAllBookings,
  approveBooking,
  rejectBooking,
  cancelBooking,
  deleteBooking,
} from '../../api/bookingApi';

const STATUS_BADGE = {
  PENDING:   { background: '#FEF3C7', color: '#92400E' },
  APPROVED:  { background: '#D1FAE5', color: '#065F46' },
  REJECTED:  { background: '#FEE2E2', color: '#991B1B' },
  CANCELLED: { background: '#F3F4F6', color: '#374151' },
};

const formatDateTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

function StatusBadge({ status }) {
  const s = STATUS_BADGE[status] ?? STATUS_BADGE.CANCELLED;
  return (
    <span style={{
      ...s,
      padding: '4px 10px',
      borderRadius: '999px',
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      fontFamily: 'Inter, sans-serif',
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}

export default function AdminBookingPanel() {
  const [bookings, setBookings]     = useState([]);
  const [stats, setStats]           = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // filter state
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDate, setFilterDate]     = useState('');
  const [appliedStatus, setAppliedStatus] = useState('ALL');
  const [appliedDate, setAppliedDate]     = useState('');

  // reject modal
  const [rejectModal, setRejectModal]   = useState({ open: false, bookingId: null });
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError]   = useState('');
  const [rejecting, setRejecting]       = useState(false);

  // cancel modal
  const [cancelModal, setCancelModal]   = useState({ open: false, bookingId: null });
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling]     = useState(false);

  const fetchStats = async () => {
    try {
      const res = await getAllBookings();
      const all = res.data?.content ?? res.data ?? [];
      setStats({
        total:    all.length,
        pending:  all.filter((b) => b.status === 'PENDING').length,
        approved: all.filter((b) => b.status === 'APPROVED').length,
        rejected: all.filter((b) => b.status === 'REJECTED').length,
      });
    } catch (_) { /* stats fail silently */ }
  };

  const fetchBookings = async (status, date) => {
    setLoading(true);
    setError('');
    try {
      const res = await getAllBookings(status, date);
      setBookings(res.data?.content ?? res.data ?? []);
    } catch (_) {
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchStats();
    fetchBookings(appliedStatus, appliedDate);
  };

  useEffect(() => {
    fetchStats();
    fetchBookings('ALL', '');
  }, []);

  const handleFilter = () => {
    setAppliedStatus(filterStatus);
    setAppliedDate(filterDate);
    fetchBookings(filterStatus, filterDate);
  };

  const handleApprove = async (id) => {
    setActionLoading(`${id}_approve`);
    try {
      await approveBooking(id);
      refresh();
    } catch (_) {
      alert('Failed to approve booking.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this booking permanently?')) return;
    setActionLoading(`${id}_delete`);
    try {
      await deleteBooking(id);
      refresh();
    } catch (_) {
      alert('Failed to delete booking.');
    } finally {
      setActionLoading(null);
    }
  };

  // reject modal handlers
  const openRejectModal  = (id) => { setRejectModal({ open: true, bookingId: id }); setRejectReason(''); setRejectError(''); };
  const closeRejectModal = ()   => { setRejectModal({ open: false, bookingId: null }); setRejecting(false); setRejectError(''); };
  const confirmReject    = async () => {
    if (rejectReason.trim().length < 10) { setRejectError('Reason must be at least 10 characters.'); return; }
    setRejecting(true);
    try {
      await rejectBooking(rejectModal.bookingId, rejectReason.trim());
      closeRejectModal();
      refresh();
    } catch (_) {
      setRejectError('Failed to reject booking.');
      setRejecting(false);
    }
  };

  // cancel modal handlers
  const openCancelModal  = (id) => { setCancelModal({ open: true, bookingId: id }); setCancelReason(''); };
  const closeCancelModal = ()   => { setCancelModal({ open: false, bookingId: null }); setCancelling(false); };
  const confirmCancel    = async () => {
    setCancelling(true);
    try {
      await cancelBooking(cancelModal.bookingId, cancelReason.trim() || null);
      closeCancelModal();
      refresh();
    } catch (_) {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-8 px-4 pb-10 pt-6">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div>
        <h2 className="font-headline text-3xl font-extrabold tracking-tighter text-[#272269]">
          Bookings Management
        </h2>
        <p className="mt-1 text-sm font-medium text-[#272269]/60">
          Review, approve, reject and manage all facility bookings.
        </p>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon="calendar_month"  title="Total Bookings"    value={String(stats.total)} />
        <MetricCard icon="hourglass_empty" title="Pending"           value={String(stats.pending)}  accentClassName="bg-yellow-50 text-yellow-600" />
        <MetricCard icon="check_circle"    title="Approved"          value={String(stats.approved)} accentClassName="bg-emerald-50 text-emerald-600" />
        <MetricCard icon="cancel"          title="Rejected"          value={String(stats.rejected)} accentClassName="bg-red-50 text-red-600" />
      </section>

      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <section className="glass-panel rounded-2xl border border-white/50 p-6 shadow-md">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[#272269]/50">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-[#272269]/15 bg-white/70 px-4 py-2.5 text-sm font-medium text-[#272269] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F17620]/40"
            >
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[#272269]/50">Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="rounded-xl border border-[#272269]/15 bg-white/70 px-4 py-2.5 text-sm font-medium text-[#272269] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F17620]/40"
            />
          </div>

          <button
            onClick={handleFilter}
            className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90"
            style={{ background: '#F57923' }}
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              filter_list
            </span>
            Apply Filter
          </button>
        </div>
      </section>

      {/* ── Bookings table ──────────────────────────────────────────────────── */}
      <section className="glass-panel overflow-hidden rounded-2xl border border-white/50 shadow-md">
        <div className="border-b border-[#272269]/10 px-6 py-4">
          <h3 className="font-headline text-lg font-bold text-[#272269]">All Bookings</h3>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <span className="material-symbols-outlined text-3xl text-[#F17620]" style={{ animation: 'spin 1s linear infinite' }}>
              progress_activity
            </span>
          </div>
        )}

        {!loading && error && (
          <div className="py-16 text-center text-sm font-medium text-red-600">{error}</div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="py-16 text-center text-sm font-medium text-[#272269]/40">No bookings found.</div>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9FAFB]">
                  {['ID', 'Resource ID', 'User ID', 'Start Time', 'End Time', 'Purpose', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#272269]/50 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-t border-[#272269]/5 transition-colors hover:bg-[#272269]/[0.02]">
                    <td className="px-5 py-4 font-headline font-bold text-[#272269]">#{b.id}</td>
                    <td className="px-5 py-4 text-[#272269]/70">{b.resourceId ?? '—'}</td>
                    <td className="px-5 py-4 text-[#272269]/70">{b.userId ?? '—'}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-[#272269]/70">{formatDateTime(b.startDateTime)}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-[#272269]/70">{formatDateTime(b.endDateTime)}</td>
                    <td className="max-w-[180px] truncate px-5 py-4 text-[#272269]/70">{b.purpose ?? '—'}</td>
                    <td className="px-5 py-4"><StatusBadge status={b.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {b.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(b.id)}
                              disabled={actionLoading === `${b.id}_approve`}
                              className="rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                              style={{ background: '#10B981' }}
                            >
                              {actionLoading === `${b.id}_approve` ? '…' : 'Approve'}
                            </button>
                            <button
                              onClick={() => openRejectModal(b.id)}
                              className="rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-80"
                              style={{ background: '#EF4444' }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {b.status === 'APPROVED' && (
                          <button
                            onClick={() => openCancelModal(b.id)}
                            className="rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-80"
                            style={{ background: '#F57923' }}
                          >
                            Cancel
                          </button>
                        )}
                        {(b.status === 'REJECTED' || b.status === 'CANCELLED') && (
                          <button
                            onClick={() => handleDelete(b.id)}
                            disabled={actionLoading === `${b.id}_delete`}
                            className="rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                            style={{ background: '#EF4444' }}
                          >
                            {actionLoading === `${b.id}_delete` ? '…' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Reject Modal ────────────────────────────────────────────────────── */}
      {rejectModal.open && (
        <div
          onClick={closeRejectModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(39,34,105,0.4)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '440px', boxShadow: '0 24px 48px rgba(39,34,105,0.18)' }}>
            <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '20px', color: '#272269', margin: '0 0 6px' }}>
              Reject Booking #{rejectModal.bookingId}
            </h3>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 16px' }}>
              Provide a reason for rejection (minimum 10 characters).
            </p>
            <textarea
              placeholder="Enter rejection reason…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', background: '#FAFAFA', fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#374151', resize: 'vertical', minHeight: '100px', outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }}
            />
            {rejectError && (
              <p style={{ color: '#991B1B', fontSize: '13px', margin: '0 0 12px' }}>{rejectError}</p>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                onClick={closeRejectModal}
                disabled={rejecting}
                style={{ padding: '10px 20px', borderRadius: '10px', background: '#F3F4F6', color: '#374151', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={rejecting}
                style={{ padding: '10px 22px', borderRadius: '10px', background: '#EF4444', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer', opacity: rejecting ? 0.7 : 1 }}
              >
                {rejecting ? 'Rejecting…' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Modal ────────────────────────────────────────────────────── */}
      {cancelModal.open && (
        <div
          onClick={closeCancelModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(39,34,105,0.4)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '440px', boxShadow: '0 24px 48px rgba(39,34,105,0.18)' }}>
            <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '20px', color: '#272269', margin: '0 0 6px' }}>
              Cancel Booking #{cancelModal.bookingId}
            </h3>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 16px' }}>
              Optionally provide a reason for cancellation.
            </p>
            <textarea
              placeholder="Reason for cancellation (optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', background: '#FAFAFA', fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#374151', resize: 'vertical', minHeight: '100px', outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                onClick={closeCancelModal}
                disabled={cancelling}
                style={{ padding: '10px 20px', borderRadius: '10px', background: '#F3F4F6', color: '#374151', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmCancel}
                disabled={cancelling}
                style={{ padding: '10px 22px', borderRadius: '10px', background: '#F57923', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer', opacity: cancelling ? 0.7 : 1 }}
              >
                {cancelling ? 'Cancelling…' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
