import { useState } from 'react';
import useBookings from '../../viewmodels/useBookings';
import StatusBadge from '../../components/booking/StatusBadge';

// ── SVG Icons ────────────────────────────────────────────────────────────────

const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconChevronDown = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// ── Stat Card ─────────────────────────────────────────────────────────────────

const StatCard = ({ title, count, icon, accentColor }) => (
  <div style={{
    flex: 1, minWidth: '160px',
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    display: 'flex', flexDirection: 'column',
  }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
      <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif' }}>
        {title}
      </span>
      <span style={{ fontSize: '22px', lineHeight: 1 }}>{icon}</span>
    </div>
    <div style={{ fontSize: '36px', fontWeight: 800, fontFamily: 'Manrope, sans-serif', color: '#110755', lineHeight: 1, marginBottom: '14px' }}>
      {count}
    </div>
    <div style={{ height: '3px', width: '40px', borderRadius: '999px', background: accentColor }} />
  </div>
);

// ── Component ────────────────────────────────────────────────────────────────

const UserDashboard = () => {
  const { bookings, loading, error, stats, handleCancel } = useBookings();
  const [activeNav, setActiveNav] = useState('Bookings');

  const [cancelModal, setCancelModal] = useState({ open: false, bookingId: null });
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const openCancelModal  = (id) => { setCancelModal({ open: true, bookingId: id }); setCancelReason(''); setCancelError(''); };
  const closeCancelModal = ()   => { setCancelModal({ open: false, bookingId: null }); setCancelling(false); setCancelError(''); };

  const confirmCancel = async () => {
    setCancelling(true); setCancelError('');
    try   { await handleCancel(cancelModal.bookingId, cancelReason); closeCancelModal(); }
    catch (err) { setCancelError(err.message); setCancelling(false); }
  };

  const NAV_LINKS = ['Home', 'Bookings', 'Tickets', 'Resources', 'FAQ'];

  return (
    <>
      {/* ── Global styles ─────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; font-family: Inter, sans-serif; background: #E7ECFE; }

        /* ─ Header ─ */
        .uc-header {
          width: 100%; height: 70px;
          background: #ffffff;
          border-bottom: 1px solid #F3F4F6;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          display: flex; align-items: center;
          padding: 0 32px; gap: 0;
          position: sticky; top: 0; z-index: 200; flex-shrink: 0;
        }

        /* Logo block */
        .uc-logo { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .uc-logo-circle {
          width: 38px; height: 38px; border-radius: 11px;
          background: #F57923;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-family: Manrope, sans-serif;
          font-size: 1.1rem; font-weight: 800; flex-shrink: 0;
          box-shadow: 0 4px 10px rgba(245,121,35,0.32);
        }
        .uc-logo-text { display: flex; flex-direction: column; line-height: 1; }
        .uc-logo-name {
          font-family: Manrope, sans-serif; font-size: 1.05rem;
          font-weight: 800; color: #110755;
        }
        .uc-logo-sub {
          font-size: 0.52rem; font-weight: 700;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: #9CA3AF; margin-top: 3px;
        }

        /* Nav */
        .uc-nav { display: flex; align-items: center; gap: 2px; flex: 1; justify-content: center; }
        .uc-nav-btn {
          padding: 7px 14px; border-radius: 8px;
          font-size: 0.875rem; font-weight: 500;
          color: #6B7280; cursor: pointer;
          border: none; background: transparent;
          font-family: Inter, sans-serif;
          transition: color 0.15s, background 0.15s;
        }
        .uc-nav-btn:hover { color: #110755; background: #F3F4F6; }
        .uc-nav-btn.active { color: #F57923; font-weight: 700; background: #FFF7ED; }

        /* User chip */
        .uc-user { display: flex; align-items: center; gap: 10px; flex-shrink: 0; cursor: pointer; }
        .uc-user-info { text-align: right; line-height: 1; }
        .uc-user-name { font-size: 0.875rem; font-weight: 700; color: #110755; font-family: Inter, sans-serif; }
        .uc-user-role { font-size: 0.58rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #F57923; margin-top: 3px; }
        .uc-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: #F57923;
          display: flex; align-items: center; justify-content: center;
          font-family: Manrope, sans-serif; font-weight: 800;
          font-size: 0.78rem; color: #fff; flex-shrink: 0;
        }
        .uc-chevron { color: #9CA3AF; display: flex; align-items: center; margin-left: 2px; }

        /* ─ Layout ─ */
        .uc-app  { display: flex; flex-direction: column; min-height: 100vh; }
        .uc-body { display: flex; flex: 1; }

        /* ─ Sidebar ─ */
        .uc-sidebar {
          width: 240px; min-width: 240px;
          background: #ffffff;
          box-shadow: 2px 0 8px rgba(0,0,0,0.05);
          display: flex; flex-direction: column;
          height: calc(100vh - 70px);
          position: sticky; top: 70px;
          overflow-y: auto;
        }
        .uc-sb-brand {
          padding: 22px 18px 18px;
          border-bottom: 1px solid #F3F4F6;
          display: flex; align-items: center; gap: 10px;
        }
        .uc-sb-circle {
          width: 34px; height: 34px; border-radius: 9px;
          background: #F57923;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-family: Manrope, sans-serif;
          font-size: 0.9rem; font-weight: 800; flex-shrink: 0;
          box-shadow: 0 3px 8px rgba(245,121,35,0.28);
        }
        .uc-sb-brand-text { display: flex; flex-direction: column; line-height: 1; }
        .uc-sb-brand-name { font-family: Manrope, sans-serif; font-weight: 800; font-size: 0.95rem; color: #110755; }
        .uc-sb-brand-sub  { font-size: 0.5rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #9CA3AF; margin-top: 3px; }

        .uc-sb-nav { flex: 1; padding: 12px 10px; display: flex; flex-direction: column; gap: 2px; }
        .uc-sb-item {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px;
          font-size: 0.875rem; font-weight: 500;
          font-family: Inter, sans-serif;
          color: #374151; background: transparent;
          border-left: 3px solid transparent;
          border-radius: 0 8px 8px 0;
          cursor: pointer; transition: all 0.15s;
          user-select: none;
        }
        .uc-sb-item:hover { background: #F9FAFB; color: #110755; }
        .uc-sb-item.active {
          color: #F57923; background: #FFF7ED;
          border-left: 3px solid #F57923;
          font-weight: 600;
        }

        .uc-sb-footer { padding: 12px 10px 20px; border-top: 1px solid #F3F4F6; }
        .uc-logout {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px;
          font-size: 0.875rem; font-weight: 500;
          font-family: Inter, sans-serif;
          color: #9CA3AF; background: transparent;
          border: none; border-radius: 8px;
          width: 100%; text-align: left; cursor: pointer;
          transition: color 0.15s, background 0.15s;
        }
        .uc-logout:hover { color: #F57923; background: #FFF7ED; }

        /* ─ Main ─ */
        .uc-main    { flex: 1; min-width: 0; }
        .uc-content { padding: 32px; }

        /* ─ Table ─ */
        .uc-table { width: 100%; border-collapse: collapse; font-size: 14px; font-family: Inter, sans-serif; }
        .uc-th {
          padding: 12px 20px; text-align: left;
          font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; color: #9CA3AF;
          background: #F9FAFB; white-space: nowrap;
        }
        .uc-td { padding: 15px 20px; color: #374151; vertical-align: middle; border-bottom: 1px solid #F3F4F6; }
        .uc-tr:last-child .uc-td { border-bottom: none; }
        .uc-tr:hover .uc-td { background: #F9FAFB; }

        /* ─ Responsive ─ */
        @media (max-width: 900px) { .uc-nav { display: none; } }
        @media (max-width: 767px) { .uc-sidebar { display: none; } .uc-content { padding: 20px 16px; } }
      `}</style>

      <div className="uc-app">

        {/* ══ Header ══════════════════════════════════════════════════════════ */}
        <header className="uc-header">

          {/* Logo */}
          <div className="uc-logo">
            <div className="uc-logo-circle">U</div>
            <div className="uc-logo-text">
              <span className="uc-logo-name">UniCore</span>
              <span className="uc-logo-sub">Operational Hub</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="uc-nav">
            {NAV_LINKS.map((link) => (
              <button
                key={link}
                className={`uc-nav-btn${activeNav === link ? ' active' : ''}`}
                onClick={() => setActiveNav(link)}
              >
                {link}
              </button>
            ))}
          </nav>

          {/* User */}
          <div className="uc-user">
            <div className="uc-user-info">
              <div className="uc-user-name">User</div>
              <div className="uc-user-role">User</div>
            </div>
            <div className="uc-avatar">SU</div>
            <span className="uc-chevron"><IconChevronDown /></span>
          </div>

        </header>

        {/* ══ Body ════════════════════════════════════════════════════════════ */}
        <div className="uc-body">

          {/* ── Sidebar ── */}
          <aside className="uc-sidebar">

            {/* Brand */}
            <div className="uc-sb-brand">
              <div className="uc-sb-circle">U</div>
              <div className="uc-sb-brand-text">
                <span className="uc-sb-brand-name">UniCore</span>
                <span className="uc-sb-brand-sub">Operational Hub</span>
              </div>
            </div>

            {/* Nav */}
            <nav className="uc-sb-nav">
              <div className="uc-sb-item active">
                <IconCalendar />
                My Bookings
              </div>
            </nav>

            {/* Footer */}
            <div className="uc-sb-footer">
              <button className="uc-logout">
                <IconLogout />
                Logout
              </button>
            </div>

          </aside>

          {/* ── Main ── */}
          <main className="uc-main">
            <div className="uc-content">

              {/* Page heading */}
              <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '28px', fontWeight: 800, color: '#110755', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                  Welcome, Student
                </h1>
                <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '6px', fontFamily: 'Inter, sans-serif' }}>
                  Here's an overview of your facility bookings.
                </p>
              </div>

              {/* Stat cards */}
              <div style={{ display: 'flex', gap: '20px', marginBottom: '28px', flexWrap: 'wrap' }}>
                <StatCard title="Total Bookings" count={loading ? '—' : stats.total}    icon="📋" accentColor="#F57923" />
                <StatCard title="Approved"       count={loading ? '—' : stats.approved} icon="✅" accentColor="#10B981" />
                <StatCard title="Pending"        count={loading ? '—' : stats.pending}  icon="⏳" accentColor="#F57923" />
              </div>

              {/* Bookings table card */}
              <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

                {/* Card header */}
                <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid #F3F4F6' }}>
                  <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '18px', fontWeight: 700, color: '#110755', margin: 0 }}>
                    My Recent Bookings
                  </h2>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>

                  {loading && (
                    <div style={{ padding: '56px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
                      Loading your bookings…
                    </div>
                  )}
                  {!loading && error && (
                    <div style={{ padding: '56px 20px', textAlign: 'center', color: '#991B1B', fontSize: '14px' }}>
                      {error}
                    </div>
                  )}
                  {!loading && !error && bookings.length === 0 && (
                    <div style={{ padding: '56px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
                      No bookings yet.
                    </div>
                  )}

                  {!loading && !error && bookings.length > 0 && (
                    <table className="uc-table">
                      <thead>
                        <tr>
                          {['Resource ID', 'Start Time', 'End Time', 'Purpose', 'Status', 'Actions'].map((h) => (
                            <th key={h} className="uc-th">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((b) => (
                          <tr key={b.id} className="uc-tr">
                            <td className="uc-td" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, color: '#110755' }}>
                              #{b.resourceId ?? b.id}
                            </td>
                            <td className="uc-td" style={{ whiteSpace: 'nowrap' }}>{formatDateTime(b.startDateTime)}</td>
                            <td className="uc-td" style={{ whiteSpace: 'nowrap' }}>{formatDateTime(b.endDateTime)}</td>
                            <td className="uc-td" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {b.purpose}
                            </td>
                            <td className="uc-td"><StatusBadge status={b.status} /></td>
                            <td className="uc-td">
                              {b.status === 'APPROVED' ? (
                                <button
                                  onClick={() => openCancelModal(b.id)}
                                  style={{
                                    padding: '6px 16px', borderRadius: '999px',
                                    background: 'linear-gradient(135deg, #F57923, #fe802a)',
                                    color: '#fff', fontSize: '12px', fontWeight: 600,
                                    border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                                    boxShadow: '0 2px 8px rgba(245,121,35,0.3)',
                                    transition: 'opacity 0.15s',
                                  }}
                                  onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
                                  onMouseOut={(e)  => (e.currentTarget.style.opacity = '1')}
                                >
                                  Cancel
                                </button>
                              ) : (
                                <span style={{ color: '#D1D5DB', fontSize: '14px' }}>—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>
          </main>

        </div>
      </div>

      {/* ══ Cancel modal ════════════════════════════════════════════════════ */}
      {cancelModal.open && (
        <div
          onClick={closeCancelModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(17,7,85,0.3)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '440px', boxShadow: '0 24px 48px rgba(17,7,85,0.15)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '18px', color: '#110755', margin: '0 0 6px' }}>Cancel Booking</h3>
              <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>Optionally provide a reason for cancelling.</p>
            </div>
            <textarea
              placeholder="Reason for cancellation (optional, max 500 chars)"
              maxLength={500}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', background: '#FAFAFA', fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#374151', resize: 'vertical', minHeight: '90px', outline: 'none', boxSizing: 'border-box' }}
            />
            {cancelError && <p style={{ color: '#991B1B', fontSize: '13px', margin: 0 }}>{cancelError}</p>}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeCancelModal} disabled={cancelling}
                style={{ padding: '10px 20px', borderRadius: '10px', background: '#F3F4F6', color: '#374151', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer' }}
              >
                Keep Booking
              </button>
              <button
                onClick={confirmCancel} disabled={cancelling}
                style={{ padding: '10px 22px', borderRadius: '10px', background: 'linear-gradient(135deg,#F57923,#fe802a)', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer', opacity: cancelling ? 0.7 : 1, boxShadow: '0 4px 12px rgba(245,121,35,0.35)' }}
              >
                {cancelling ? 'Cancelling…' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserDashboard;
