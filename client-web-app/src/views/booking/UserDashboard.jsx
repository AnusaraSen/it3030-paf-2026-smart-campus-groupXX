import React, { useCallback, useMemo, useState } from 'react';
import useBookings from '../../viewmodels/useBookings';
import StatusBadge from '../../components/booking/StatusBadge';
import { clearAuthSession, getAuthSession, updateStoredAuthUser, updateUserById } from '../../api/authApi';
import SiteHeader from '../../components/shared/SiteHeader.jsx';
import UserSidebar from '../../components/user-dashboard/UserSidebar.jsx';
import { MyTicketsPage } from '../../pages/MyTicketsPage.js';

const formatDateTime = (iso) => {
  if (!iso) {
    return '—';
  }

  const date = new Date(iso);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getDisplayName = (currentUser) => {
  if (!currentUser) {
    return 'Student';
  }

  const firstName = typeof currentUser.firstName === 'string' ? currentUser.firstName.trim() : '';
  const lastName = typeof currentUser.lastName === 'string' ? currentUser.lastName.trim() : '';

  if (firstName || lastName) {
    return [firstName, lastName].filter(Boolean).join(' ');
  }

  if (typeof currentUser.name === 'string' && currentUser.name.trim()) {
    return currentUser.name.trim();
  }

  return typeof currentUser.email === 'string' && currentUser.email.includes('@')
    ? currentUser.email.split('@')[0]
    : 'Student';
};

const formatValue = (value) => {
  if (value === null || typeof value === 'undefined' || value === '') {
    return 'Not provided';
  }

  return String(value);
};

const getRoleLabel = (currentUser) => {
  if (!currentUser?.role) {
    return 'Student';
  }

  return currentUser.role;
};

const buildEditForm = (user) => ({
  firstName: user?.firstName || '',
  lastName: user?.lastName || '',
  email: user?.email || '',
  password: '',
  confirmPassword: '',
});

const StatCard = ({ title, count, icon, accentColor }) => (
  <div className="flex min-w-[160px] flex-1 flex-col rounded-3xl border border-white/50 bg-white/70 p-6 shadow-xl shadow-[#272269]/5 backdrop-blur-2xl">
    <div className="mb-4 flex items-start justify-between">
      <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#272269]/40">{title}</span>
      <span
        aria-hidden="true"
        className="material-symbols-outlined text-[28px] leading-none text-[#272269]"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {icon}
      </span>
    </div>
    <div className="mb-4 font-headline text-4xl font-black leading-none text-[#272269]">{count}</div>
    <div className="h-1 w-10 rounded-full" style={{ background: accentColor }} />
  </div>
);

export default function UserDashboard({ onHome, onLogout, onOpenTickets }) {
  const authSession = getAuthSession();
  const [profileUser, setProfileUser] = useState(() => authSession?.user || null);
  const currentUser = profileUser;
  const isAuthenticated = Boolean(authSession?.accessToken && currentUser);
  const displayName = getDisplayName(currentUser);

  const { bookings, loading, error, stats, handleCancel } = useBookings();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState(() => buildEditForm(currentUser));
  const [cancelModal, setCancelModal] = useState({ open: false, bookingId: null });
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const isGoogleAccount = currentUser?.provider === 'GOOGLE';
  const canEditProfile = !isGoogleAccount;

  const handleLogout = useCallback(() => {
    if (onLogout) {
      onLogout();
      return;
    }

    clearAuthSession();
    window.location.reload();
  }, [onLogout]);

  const handleOpenDashboard = useCallback(() => {
    setActiveSection('dashboard');
  }, []);

  const handleOpenUserInformation = useCallback(() => {
    setActiveSection('user-information');
  }, []);

  const handleOpenTicketsSection = useCallback(() => {
    setActiveSection('tickets');
  }, []);

  const openEditModal = useCallback(() => {
    setEditError('');
    setEditForm(buildEditForm(currentUser));
    setEditModalOpen(true);
  }, [currentUser]);

  const closeEditModal = useCallback(() => {
    setEditModalOpen(false);
    setEditSaving(false);
    setEditError('');
  }, []);

  const handleEditSubmit = useCallback(async (event) => {
    event.preventDefault();

    if (!currentUser?.id) {
      setEditError('User information is unavailable.');
      return;
    }

    if (!canEditProfile) {
      setEditError('Google-linked accounts cannot edit these fields here.');
      return;
    }

    const nextFirstName = editForm.firstName.trim();
    const nextLastName = editForm.lastName.trim();
    const nextEmail = editForm.email.trim().toLowerCase();
    const nextPassword = editForm.password.trim();

    if (!nextFirstName || !nextLastName || !nextEmail) {
      setEditError('First name, last name, and email are required.');
      return;
    }

    if (editForm.password || editForm.confirmPassword) {
      if (editForm.password !== editForm.confirmPassword) {
        setEditError('Password confirmation does not match.');
        return;
      }
    }

    setEditSaving(true);
    setEditError('');

    try {
      const payload = {
        firstName: nextFirstName,
        lastName: nextLastName,
        email: nextEmail,
      };

      if (nextPassword) {
        payload.password = nextPassword;
      }

      const updatedUser = await updateUserById(currentUser.id, payload, authSession?.accessToken || '');
      const mergedUser = {
        ...currentUser,
        ...updatedUser,
      };

      if (nextPassword || nextEmail !== currentUser.email) {
        closeEditModal();
        handleLogout();
        return;
      }

      setProfileUser(mergedUser);
      updateStoredAuthUser(mergedUser);
      setEditModalOpen(false);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : 'Failed to update account information.');
    } finally {
      setEditSaving(false);
    }
  }, [authSession?.accessToken, canEditProfile, closeEditModal, currentUser, editForm, onLogout]);

  const openCancelModal = (bookingId) => {
    setCancelModal({ open: true, bookingId });
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
      setCancelError(err instanceof Error ? err.message : 'Failed to cancel booking.');
      setCancelling(false);
    }
  };

  const pendingBookings = useMemo(
    () => bookings.filter((booking) => booking.status === 'PENDING').length,
    [bookings],
  );

  const approvedBookings = useMemo(
    () => bookings.filter((booking) => booking.status === 'APPROVED').length,
    [bookings],
  );

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_0%_0%,#E0E7FF_0%,#faf9f9_100%)] px-6 text-center">
        <div className="glass-panel max-w-md rounded-3xl border border-white/50 p-8 shadow-xl">
          <h1 className="font-headline text-3xl font-black text-[#272269]">Session Required</h1>
          <p className="mt-3 text-sm text-[#272269]/70">Please sign in to view your dashboard.</p>
          <button className="uc-button uc-button--primary uc-button--large mt-6" type="button" onClick={onHome}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,#E0E7FF_0%,#faf9f9_100%)] text-[#272269]">
      <SiteHeader
        className="landing-nav--dashboard"
        onHome={onHome}
        onOpenBookings={handleOpenDashboard}
        onOpenTickets={onOpenTickets}
        onLogout={handleLogout}
      />

      <div className="flex gap-2 px-5 pb-6 pt-8">
        <UserSidebar
          className={activeSection === 'tickets' ? 'mt-16' : activeSection === 'bookings' ? 'mt-20' : ''}
          collapsed={isSidebarCollapsed}
          activeSection={activeSection}
          onHome={onHome}
          onNavigateSection={(section) => {
            if (section === 'dashboard') {
              handleOpenDashboard();
              return;
            }

            if (section === 'user-information') {
              handleOpenUserInformation();
              return;
            }

            if (section === 'tickets') {
              handleOpenTicketsSection();
              return;
            }

            setActiveSection(section);
          }}
          onToggleCollapse={() => setIsSidebarCollapsed((currentValue) => !currentValue)}
        />

        <main className="relative flex min-h-[calc(100vh-7rem)] min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="space-y-10 px-4 pb-10 pt-16">
            {activeSection === 'dashboard' ? (
              <>
                <section className="glass-panel relative overflow-hidden rounded-3xl border border-white/50 p-12 shadow-xl shadow-[#272269]/5">
                  <div className="absolute right-[-50px] top-[-50px] h-96 w-96 rounded-full bg-[#F17620] aura-glow" />
                  <div className="absolute bottom-[-100px] left-[10%] h-64 w-64 rounded-full bg-[#272269] aura-glow" />
                  <div className="relative z-10 flex flex-col items-end justify-between gap-8 md:flex-row md:items-end">
                    <div className="max-w-2xl">
                      <span className="mb-4 inline-block rounded-full border border-[#F17620]/20 bg-[#F17620]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F17620]">
                        Student Status: Active
                      </span>
                      <h2 className="mb-4 font-headline text-5xl font-extrabold leading-none tracking-tighter text-[#272269]">
                        Welcome, <br />
                        <span className="text-[#F17620]">{displayName}</span>
                      </h2>
                      <p className="max-w-lg font-medium text-[#272269]/70">
                        Track your facility bookings, monitor approvals, and keep up with your active requests from one workspace.
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <div className="min-w-[140px] rounded-2xl border border-white bg-white/50 p-6 text-center shadow-sm">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#272269]/50">Total</p>
                        <p className="font-headline text-3xl font-black text-[#272269]">{loading ? '...' : stats.total}</p>
                      </div>
                      <div className="min-w-[140px] rounded-2xl border border-white bg-white/50 p-6 text-center shadow-sm">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#272269]/50">Approved</p>
                        <p className="font-headline text-3xl font-black text-[#F17620]">{loading ? '...' : approvedBookings}</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <StatCard icon="calendar_month" title="Total Bookings" count={loading ? '—' : stats.total} accentColor="#F17620" />
                  <StatCard icon="task_alt" title="Approved" count={loading ? '—' : approvedBookings} accentColor="#10B981" />
                  <StatCard icon="hourglass_top" title="Pending" count={loading ? '—' : pendingBookings} accentColor="#F17620" />
                </section>

                <section className="glass-panel rounded-3xl border border-white/50 p-8 shadow-xl shadow-[#272269]/5">
                  <div className="mb-8 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-headline text-2xl font-black text-[#272269]">Recent Bookings</h3>
                      <p className="mt-2 text-sm text-[#272269]/70">Review your latest bookings and cancel approved requests when needed.</p>
                    </div>
                  </div>

                  {loading && (
                    <div className="py-14 text-center text-sm text-[#272269]/50">Loading your bookings...</div>
                  )}

                  {!loading && error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>
                  )}

                  {!loading && !error && bookings.length === 0 && (
                    <div className="py-14 text-center text-sm text-[#272269]/50">No bookings yet.</div>
                  )}

                  {!loading && !error && bookings.length > 0 && (
                    <div className="overflow-x-auto rounded-2xl border border-white/60 bg-white/70">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-white/80 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-[#272269]/40">
                            {['Resource ID', 'Start Time', 'End Time', 'Purpose', 'Status', 'Actions'].map((heading) => (
                              <th key={heading} className="px-5 py-4">{heading}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.map((booking) => (
                            <tr key={booking.id} className="border-t border-[#272269]/5 transition-colors hover:bg-[#F9FAFB]">
                              <td className="px-5 py-4 font-headline font-black text-[#272269]">#{booking.resourceId ?? booking.id}</td>
                              <td className="px-5 py-4 whitespace-nowrap">{formatDateTime(booking.startDateTime)}</td>
                              <td className="px-5 py-4 whitespace-nowrap">{formatDateTime(booking.endDateTime)}</td>
                              <td className="max-w-[220px] px-5 py-4">
                                <span className="block truncate">{booking.purpose}</span>
                              </td>
                              <td className="px-5 py-4"><StatusBadge status={booking.status} /></td>
                              <td className="px-5 py-4">
                                {booking.status === 'APPROVED' ? (
                                  <button
                                    onClick={() => openCancelModal(booking.id)}
                                    className="rounded-full bg-gradient-to-r from-[#F17620] to-[#fe802a] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-[#F17620]/25 transition-opacity hover:opacity-90"
                                    type="button"
                                  >
                                    Cancel
                                  </button>
                                ) : (
                                  <span className="text-sm text-[#272269]/25">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            ) : activeSection === 'user-information' ? (
              <>
                <section className="glass-panel relative overflow-hidden rounded-3xl border border-white/50 p-12 shadow-xl shadow-[#272269]/5">
                  <div className="absolute right-[-50px] top-[-50px] h-96 w-96 rounded-full bg-[#F17620] aura-glow" />
                  <div className="absolute bottom-[-100px] left-[10%] h-64 w-64 rounded-full bg-[#272269] aura-glow" />
                  <div className="relative z-10 flex flex-col items-end justify-between gap-8 md:flex-row md:items-end">
                    <div className="max-w-2xl">
                      <span className="mb-4 inline-block rounded-full border border-[#F17620]/20 bg-[#F17620]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F17620]">
                        Account Profile
                      </span>
                      <h2 className="mb-4 font-headline text-5xl font-extrabold leading-none tracking-tighter text-[#272269]">
                        User <br />
                        <span className="text-[#F17620]">Information</span>
                      </h2>
                      <p className="max-w-lg font-medium text-[#272269]/70">
                        Review the account details tied to your UniCore session.
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <div className="min-w-[140px] rounded-2xl border border-white bg-white/50 p-6 text-center shadow-sm">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#272269]/50">Role</p>
                        <p className="font-headline text-3xl font-black text-[#F17620]">{formatValue(getRoleLabel(currentUser))}</p>
                      </div>
                      <div className="min-w-[140px] rounded-2xl border border-white bg-white/50 p-6 text-center shadow-sm">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#272269]/50">Account</p>
                        <p className="font-headline text-3xl font-black text-[#272269]">Active</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="glass-panel rounded-3xl border border-white/50 p-8 shadow-xl shadow-[#272269]/5">
                  <div className="mb-8 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-headline text-2xl font-black text-[#272269]">Account Details</h3>
                      <p className="mt-2 text-sm text-[#272269]/70">Your profile information is shown below in the same dashboard style.</p>
                    </div>

                    <button
                      className="rounded-full bg-gradient-to-r from-[#F17620] to-[#fe802a] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#F17620]/25 transition-opacity hover:opacity-90"
                      type="button"
                      onClick={openEditModal}
                    >
                      Edit Information
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {[
                      { label: 'First Name', value: currentUser?.firstName, icon: 'person' },
                      { label: 'Last Name', value: currentUser?.lastName, icon: 'person' },
                      { label: 'Email', value: currentUser?.email, icon: 'alternate_email' },
                      { label: 'Role', value: getRoleLabel(currentUser), icon: 'badge' },
                      { label: 'Username', value: currentUser?.username || currentUser?.name, icon: 'account_circle' },
                      { label: 'User ID', value: currentUser?.id, icon: 'fingerprint' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm shadow-[#272269]/5">
                        <div className="mb-4 flex items-start justify-between gap-4">
                          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#272269]/40">{item.label}</span>
                          <span className="material-symbols-outlined text-[24px] leading-none text-[#272269]" aria-hidden="true" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {item.icon}
                          </span>
                        </div>
                        <div className="break-words font-headline text-lg font-black text-[#272269]">{formatValue(item.value)}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : activeSection === 'bookings' ? (
              <section className="glass-panel mt-6 rounded-3xl border border-white/50 p-8 shadow-xl shadow-[#272269]/5">
                <div className="mb-6">
                  <h3 className="font-headline text-2xl font-black text-[#272269]">My Bookings</h3>
                  <p className="mt-2 text-sm text-[#272269]/70">Manage your approved and pending bookings from this list.</p>
                </div>

                {loading && <div className="py-14 text-center text-sm text-[#272269]/50">Loading your bookings...</div>}
                {!loading && error && <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>}
                {!loading && !error && bookings.length === 0 && <div className="py-14 text-center text-sm text-[#272269]/50">No bookings yet.</div>}

                {!loading && !error && bookings.length > 0 && (
                  <div className="overflow-x-auto rounded-2xl border border-white/60 bg-white/70">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-white/80 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-[#272269]/40">
                          {['Resource ID', 'Start Time', 'End Time', 'Purpose', 'Status', 'Actions'].map((heading) => (
                            <th key={heading} className="px-5 py-4">{heading}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((booking) => (
                          <tr key={booking.id} className="border-t border-[#272269]/5 transition-colors hover:bg-[#F9FAFB]">
                            <td className="px-5 py-4 font-headline font-black text-[#272269]">#{booking.resourceId ?? booking.id}</td>
                            <td className="px-5 py-4 whitespace-nowrap">{formatDateTime(booking.startDateTime)}</td>
                            <td className="px-5 py-4 whitespace-nowrap">{formatDateTime(booking.endDateTime)}</td>
                            <td className="max-w-[220px] px-5 py-4">
                              <span className="block truncate">{booking.purpose}</span>
                            </td>
                            <td className="px-5 py-4"><StatusBadge status={booking.status} /></td>
                            <td className="px-5 py-4">
                              {booking.status === 'APPROVED' ? (
                                <button
                                  onClick={() => openCancelModal(booking.id)}
                                  className="rounded-full bg-gradient-to-r from-[#F17620] to-[#fe802a] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-[#F17620]/25 transition-opacity hover:opacity-90"
                                  type="button"
                                >
                                  Cancel
                                </button>
                              ) : (
                                <span className="text-sm text-[#272269]/25">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ) : activeSection === 'tickets' ? (
              <section className="glass-panel mt-6 rounded-3xl border border-white/50 p-8 shadow-xl shadow-[#272269]/5">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-headline text-2xl font-black text-[#272269]">My Tickets</h3>
                    <p className="mt-2 text-sm text-[#272269]/70">
                      View the tickets you submitted and check their current status.
                    </p>
                  </div>
                </div>

                <MyTicketsPage />
              </section>
            ) : (
              <section className="glass-panel mt-6 rounded-3xl border border-white/50 p-8 shadow-xl shadow-[#272269]/5">
                <h3 className="font-headline text-2xl font-black text-[#272269]">Support</h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#272269]/70">
                  Need help with a booking request, approval status, or resource selection? Use the bookings tab to review your requests,
                  or contact the campus operations team for assistance.
                </p>
              </section>
            )}
          </div>
        </main>
      </div>

      {cancelModal.open && (
        <div
          onClick={closeCancelModal}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-[#272269]/30 px-5 backdrop-blur-sm"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="flex w-full max-w-[440px] flex-col gap-4 rounded-[20px] bg-white p-8 shadow-[0_24px_48px_rgba(17,7,85,0.15)]"
          >
            <div>
              <h3 className="mb-2 font-headline text-[18px] font-bold text-[#110755]">Cancel Booking</h3>
              <p className="m-0 text-sm text-[#6B7280]">Optionally provide a reason for cancelling.</p>
            </div>

            <textarea
              placeholder="Reason for cancellation (optional, max 500 chars)"
              maxLength={500}
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              className="min-h-[90px] w-full resize-y rounded-[10px] border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 text-sm text-[#374151] outline-none"
            />

            {cancelError && <p className="m-0 text-[13px] text-[#991B1B]">{cancelError}</p>}

            <div className="flex justify-end gap-3">
              <button
                onClick={closeCancelModal}
                disabled={cancelling}
                type="button"
                className="rounded-[10px] border-0 bg-[#F3F4F6] px-5 py-2.5 text-sm font-semibold text-[#374151]"
              >
                Keep Booking
              </button>
              <button
                onClick={confirmCancel}
                disabled={cancelling}
                type="button"
                className="rounded-[10px] border-0 bg-gradient-to-r from-[#F17620] to-[#fe802a] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#F17620]/25 disabled:opacity-70"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editModalOpen && (
        <div
          onClick={closeEditModal}
          className="fixed inset-0 z-[310] flex items-center justify-center bg-[#272269]/30 px-5 backdrop-blur-sm"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="flex w-full max-w-2xl flex-col gap-5 rounded-[20px] bg-white p-8 shadow-[0_24px_48px_rgba(17,7,85,0.15)]"
          >
            <div>
              <h3 className="mb-2 font-headline text-[18px] font-bold text-[#110755]">Edit Information</h3>
              <p className="m-0 text-sm text-[#6B7280]">
                {canEditProfile
                  ? 'Update your account details. Leave password blank if you do not want to change it.'
                  : 'Google-linked accounts cannot edit first name, last name, email, or password here.'}
              </p>
            </div>

            {!canEditProfile ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
                This account is linked with Google. Please update your profile from Google if you need to change your name or email.
              </div>
            ) : (
              <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleEditSubmit}>
                <label className="flex flex-col gap-2 text-sm font-semibold text-[#272269]">
                  First Name
                  <input
                    className="rounded-[10px] border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 text-sm text-[#374151] outline-none focus:border-[#F17620]"
                    type="text"
                    value={editForm.firstName}
                    onChange={(event) => setEditForm((currentValue) => ({ ...currentValue, firstName: event.target.value }))}
                    required
                    maxLength={50}
                    disabled={editSaving}
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-semibold text-[#272269]">
                  Last Name
                  <input
                    className="rounded-[10px] border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 text-sm text-[#374151] outline-none focus:border-[#F17620]"
                    type="text"
                    value={editForm.lastName}
                    onChange={(event) => setEditForm((currentValue) => ({ ...currentValue, lastName: event.target.value }))}
                    required
                    maxLength={50}
                    disabled={editSaving}
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-semibold text-[#272269] md:col-span-2">
                  Email
                  <input
                    className="rounded-[10px] border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 text-sm text-[#374151] outline-none focus:border-[#F17620]"
                    type="email"
                    value={editForm.email}
                    onChange={(event) => setEditForm((currentValue) => ({ ...currentValue, email: event.target.value }))}
                    required
                    maxLength={100}
                    disabled={editSaving}
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-semibold text-[#272269]">
                  New Password
                  <input
                    className="rounded-[10px] border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 text-sm text-[#374151] outline-none focus:border-[#F17620]"
                    type="password"
                    value={editForm.password}
                    onChange={(event) => setEditForm((currentValue) => ({ ...currentValue, password: event.target.value }))}
                    placeholder="Leave blank to keep current password"
                    maxLength={72}
                    disabled={editSaving}
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-semibold text-[#272269]">
                  Confirm Password
                  <input
                    className="rounded-[10px] border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 text-sm text-[#374151] outline-none focus:border-[#F17620]"
                    type="password"
                    value={editForm.confirmPassword}
                    onChange={(event) => setEditForm((currentValue) => ({ ...currentValue, confirmPassword: event.target.value }))}
                    placeholder="Repeat new password"
                    maxLength={72}
                    disabled={editSaving}
                  />
                </label>

                {editError && <p className="m-0 text-[13px] text-[#991B1B] md:col-span-2">{editError}</p>}

                <div className="flex justify-end gap-3 md:col-span-2">
                  <button
                    onClick={closeEditModal}
                    disabled={editSaving}
                    type="button"
                    className="rounded-[10px] border-0 bg-[#F3F4F6] px-5 py-2.5 text-sm font-semibold text-[#374151]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSaving}
                    className="rounded-[10px] border-0 bg-gradient-to-r from-[#F17620] to-[#fe802a] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#F17620]/25 disabled:opacity-70"
                  >
                    {editSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
