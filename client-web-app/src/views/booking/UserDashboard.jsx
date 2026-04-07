import { useState } from 'react';
import useBookings from '../../viewmodels/useBookings';
import StatusBadge from '../../components/booking/StatusBadge';
import BookingStatsCard from '../../components/booking/BookingStatsCard';

// ── Inline SVG icons ────────────────────────────────────────────────────────

const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const IconMenu = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const IconClose = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ── Helpers ─────────────────────────────────────────────────────────────────

const formatDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// ── Nav config ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'my-bookings', label: 'My Bookings', Icon: IconCalendar },
];

// ── Styles ───────────────────────────────────────────────────────────────────

const S = {
  root: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: 'Inter, sans-serif',
    background: '#E7ECFE',
  },

  // Sidebar
  sidebar: (open) => ({
    width: '240px',
    minWidth: '240px',
    background: '#FFFFFF',
    borderRight: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    padding: '0',
    position: 'fixed',
    top: 0, left: 0, bottom: 0,
    zIndex: 100,
    transform: open ? 'translateX(0)' : 'translateX(-240px)',
    transition: 'transform 0.25s ease',
  }),
  sidebarBrand: {
    padding: '28px 24px 24px',
    borderBottom: '1px solid #E5E7EB',
  },
  brandText: {
    fontFamily: 'Manrope, sans-serif',
    fontWeight: 800,
    fontSize: '1.15rem',
    color: '#110755',
    letterSpacing: '-0.01em',
    margin: 0,
  },
  brandSub: {
    fontSize: '0.7rem',
    color: '#6B7280',
    marginTop: '2px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  nav: {
    flex: 1,
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navItem: (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '11px 14px',
    borderRadius: '10px',
    cursor: 'pointer',
    color: active ? '#F57923' : '#110755',
    background: active ? '#FFF7ED' : 'transparent',
    fontWeight: active ? 600 : 400,
    fontSize: '0.875rem',
    position: 'relative',
    transition: 'all 0.15s ease',
    userSelect: 'none',
  }),
  navPill: {
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '4px',
    height: '60%',
    borderRadius: '0 4px 4px 0',
    background: '#F57923',
  },
  sidebarFooter: {
    padding: '16px 12px 24px',
    borderTop: '1px solid #E5E7EB',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '11px 14px',
    borderRadius: '10px',
    cursor: 'pointer',
    color: '#6B7280',
    fontSize: '0.875rem',
    background: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    transition: 'color 0.15s ease',
  },

  // Main
  main: {
    flex: 1,
    marginLeft: '240px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    transition: 'margin-left 0.25s ease',
  },

  // Top bar (mobile)
  topBar: {
    display: 'none',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    background: '#110755',
    position: 'sticky',
    top: 0,
    zIndex: 90,
  },

  content: {
    padding: '40px 40px 60px',
  },

  // Header row
  pageHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '36px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  welcomeTitle: {
    fontFamily: 'Manrope, sans-serif',
    fontSize: '2rem',
    fontWeight: 800,
    color: '#110755',
    letterSpacing: '-0.02em',
    margin: 0,
    lineHeight: 1.1,
  },
  welcomeSub: {
    fontSize: '0.875rem',
    color: '#6B7280',
    marginTop: '6px',
  },

  // Orange primary button
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '11px 22px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #F57923, #fe802a)',
    color: '#ffffff',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 600,
    fontSize: '0.875rem',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(245,121,35,0.35)',
    whiteSpace: 'nowrap',
    transition: 'opacity 0.15s ease',
  },

  // Stats row
  statsRow: {
    display: 'flex',
    gap: '20px',
    marginBottom: '36px',
    flexWrap: 'wrap',
  },

  // Section card
  sectionCard: {
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0px 4px 24px rgba(17, 7, 85, 0.07)',
    overflow: 'hidden',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '22px 28px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  sectionTitle: {
    fontFamily: 'Manrope, sans-serif',
    fontWeight: 700,
    fontSize: '1.1rem',
    color: '#110755',
    margin: 0,
  },

  // Table
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.875rem',
    fontFamily: 'Inter, sans-serif',
  },
  th: {
    padding: '12px 20px',
    textAlign: 'left',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#9CA3AF',
    background: '#F9FAFB',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '16px 20px',
    color: '#374151',
    verticalAlign: 'middle',
  },

  // Cancel button (table inline)
  btnCancel: {
    padding: '6px 14px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #F57923, #fe802a)',
    color: '#fff',
    fontSize: '0.75rem',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'opacity 0.15s ease',
  },

  // Empty/loading states
  stateBox: {
    padding: '60px 20px',
    textAlign: 'center',
    color: '#9CA3AF',
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.9rem',
  },

  // Cancel modal overlay
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(17, 7, 85, 0.35)',
    backdropFilter: 'blur(4px)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modal: {
    background: '#fff',
    borderRadius: '20px',
    padding: '32px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0px 24px 48px rgba(17, 7, 85, 0.18)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  modalTitle: {
    fontFamily: 'Manrope, sans-serif',
    fontWeight: 700,
    fontSize: '1.15rem',
    color: '#110755',
    margin: 0,
  },
  modalSub: {
    fontSize: '0.85rem',
    color: '#6B7280',
    marginTop: '-8px',
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: 'none',
    background: 'rgba(231,236,254,0.6)',
    fontSize: '0.875rem',
    fontFamily: 'Inter, sans-serif',
    color: '#374151',
    resize: 'vertical',
    minHeight: '90px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '4px',
  },
  btnGhost: {
    padding: '10px 20px',
    borderRadius: '10px',
    background: 'rgba(17,7,85,0.05)',
    color: '#110755',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 600,
    fontSize: '0.875rem',
    border: 'none',
    cursor: 'pointer',
  },
};

// ── Component ────────────────────────────────────────────────────────────────

const UserDashboard = () => {
  const { bookings, loading, error, stats, handleCancel } = useBookings();
  const [activePage, setActivePage]   = useState('my-bookings');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Cancel modal state
  const [cancelModal, setCancelModal] = useState({ open: false, bookingId: null });
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling]   = useState(false);
  const [cancelError, setCancelError] = useState('');

  const openCancelModal = (id) => {
    setCancelModal({ open: true, bookingId: id });
    setCancelReason('');
    setCancelError('');
  };

  const closeCancelModal = () => {
    setCancelModal({ open: false, bookingId: null });
    setCancelling(false);
    setCancelError('');
  };

  const confirmCancel = async () => {
    setCancelling(true);
    setCancelError('');
    try {
      await handleCancel(cancelModal.bookingId, cancelReason);
      closeCancelModal();
    } catch (err) {
      setCancelError(err.message);
      setCancelling(false);
    }
  };

  // Responsive: detect narrow viewport
  const isNarrow = typeof window !== 'undefined' && window.innerWidth < 768;
  const effectiveSidebarOpen = isNarrow ? sidebarOpen : true;

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');

        * { box-sizing: border-box; }

        body { margin: 0; background: #E7ECFE; }

        .sidebar-overlay {
          display: none;
        }

        @media (max-width: 767px) {
          .main-area { margin-left: 0 !important; }
          .top-bar   { display: flex !important; }
          .content-pad { padding: 24px 20px 48px !important; }
          .stats-row { flex-direction: column !important; }
          .sidebar-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.4);
            z-index: 99;
          }
          .page-header { flex-direction: column !important; align-items: flex-start !important; }
        }
      `}</style>

      <div style={S.root}>

        {/* ── Sidebar overlay (mobile) ── */}
        {isNarrow && effectiveSidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Sidebar ── */}
        <aside style={S.sidebar(effectiveSidebarOpen)}>
          <div style={S.sidebarBrand}>
            <p style={S.brandText}>Smart Campus</p>
            <p style={S.brandSub}>Student Portal</p>
          </div>

          <nav style={S.nav}>
            {NAV_ITEMS.map(({ key, label, Icon }) => (
              <div
                key={key}
                style={S.navItem(activePage === key)}
                onClick={() => { setActivePage(key); if (isNarrow) setSidebarOpen(false); }}
              >
                {activePage === key && <span style={S.navPill} />}
                <Icon />
                {label}
              </div>
            ))}
          </nav>

          <div style={S.sidebarFooter}>
            <button style={S.logoutBtn}>
              <IconLogout />
              Logout
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="main-area" style={{ ...S.main, marginLeft: '240px' }}>

          {/* Mobile top bar */}
          <div className="top-bar" style={S.topBar}>
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}
            >
              {effectiveSidebarOpen ? <IconClose /> : <IconMenu />}
            </button>
            <span style={{ ...S.brandText, fontSize: '1rem' }}>Smart Campus</span>
            <span style={{ width: 22 }} />
          </div>

          {/* Page content */}
          <div className="content-pad" style={S.content}>

            {/* ── Page header ── */}
            <div className="page-header" style={S.pageHeader}>
              <div>
                <h1 style={S.welcomeTitle}>Welcome, Student</h1>
                <p style={S.welcomeSub}>Here's an overview of your facility bookings.</p>
              </div>
            </div>

            {/* ── Stats row ── */}
            <div className="stats-row" style={S.statsRow}>
              <BookingStatsCard title="Total Bookings" count={loading ? '—' : stats.total}    icon="📋" />
              <BookingStatsCard title="Approved"       count={loading ? '—' : stats.approved} icon="✅" accentColor="#166534" />
              <BookingStatsCard title="Pending"        count={loading ? '—' : stats.pending}  icon="⏳" accentColor="#B45309" />
            </div>

            {/* ── Bookings table ── */}
            <div style={S.sectionCard}>
              <div style={S.sectionHeader}>
                <h2 style={S.sectionTitle}>My Recent Bookings</h2>
              </div>

              <div style={S.tableWrap}>
                {loading && (
                  <div style={S.stateBox}>Loading your bookings…</div>
                )}

                {!loading && error && (
                  <div style={{ ...S.stateBox, color: '#991B1B' }}>{error}</div>
                )}

                {!loading && !error && bookings.length === 0 && (
                  <div style={S.stateBox}>No bookings yet. Create your first booking!</div>
                )}

                {!loading && !error && bookings.length > 0 && (
                  <table style={S.table}>
                    <thead>
                      <tr>
                        {['Resource ID', 'Start Time', 'End Time', 'Purpose', 'Status', 'Actions'].map((h) => (
                          <th key={h} style={S.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b, i) => (
                        <tr
                          key={b.id}
                          style={{ background: i % 2 === 0 ? '#fff' : '#FAFBFF' }}
                          onMouseOver={(e)  => (e.currentTarget.style.background = '#F0F4FF')}
                          onMouseOut={(e)   => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#FAFBFF')}
                        >
                          <td style={{ ...S.td, fontFamily: 'Manrope, sans-serif', fontWeight: 700, color: '#110755' }}>
                            #{b.resourceId ?? b.id}
                          </td>
                          <td style={{ ...S.td, whiteSpace: 'nowrap' }}>{formatDateTime(b.startDateTime)}</td>
                          <td style={{ ...S.td, whiteSpace: 'nowrap' }}>{formatDateTime(b.endDateTime)}</td>
                          <td style={{ ...S.td, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {b.purpose}
                          </td>
                          <td style={S.td}>
                            <StatusBadge status={b.status} />
                          </td>
                          <td style={S.td}>
                            {b.status === 'APPROVED' && (
                              <button
                                style={S.btnCancel}
                                onClick={() => openCancelModal(b.id)}
                                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.8')}
                                onMouseOut={(e)  => (e.currentTarget.style.opacity = '1')}
                              >
                                Cancel
                              </button>
                            )}
                            {b.status !== 'APPROVED' && (
                              <span style={{ color: '#D1D5DB', fontSize: '0.8rem' }}>—</span>
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

      {/* ── Cancel modal ── */}
      {cancelModal.open && (
        <div style={S.overlay} onClick={closeCancelModal}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div>
              <h3 style={S.modalTitle}>Cancel Booking</h3>
              <p style={S.modalSub}>Optionally provide a reason for cancelling.</p>
            </div>

            <textarea
              style={S.textarea}
              placeholder="Reason for cancellation (optional, max 500 chars)"
              maxLength={500}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />

            {cancelError && (
              <p style={{ color: '#991B1B', fontSize: '0.82rem', margin: 0 }}>{cancelError}</p>
            )}

            <div style={S.modalActions}>
              <button style={S.btnGhost} onClick={closeCancelModal} disabled={cancelling}>
                Keep Booking
              </button>
              <button
                style={{ ...S.btnPrimary, opacity: cancelling ? 0.7 : 1 }}
                onClick={confirmCancel}
                disabled={cancelling}
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
