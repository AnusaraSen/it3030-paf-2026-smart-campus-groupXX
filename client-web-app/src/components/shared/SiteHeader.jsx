import React, { useEffect, useRef, useState } from 'react';
import { clearAuthSession, getAuthSession } from '../../api/authApi';
import { getMyNotifications, markAllNotificationsAsRead } from '../../api/notificationsApi';

function getFullName(currentUser) {
  if (!currentUser) {
    return '';
  }

  const firstName = typeof currentUser.firstName === 'string' ? currentUser.firstName.trim() : '';
  const lastName = typeof currentUser.lastName === 'string' ? currentUser.lastName.trim() : '';

  if (firstName || lastName) {
    return [firstName, lastName].filter(Boolean).join(' ');
  }

  if (typeof currentUser.name === 'string' && currentUser.name.trim()) {
    return currentUser.name.trim();
  }

  return typeof currentUser.email === 'string' ? currentUser.email.split('@')[0] : '';
}

export default function SiteHeader({
  className = '',
  onHome,
  onOpenAbout,
  onLogin,
  onSignup,
  onOpenDashboard,
  onOpenTechnicianDashboard,
  onOpenBookings,
  onOpenTickets,
  onOpenResources,
  onLogout,
  isHomePage = false,
  isAboutPage = false,
}) {
  const authSession = getAuthSession();
  const currentUser = authSession?.user || null;
  const isLoggedIn = Boolean(authSession?.accessToken && currentUser);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);

  const unreadNotifications = notifications.filter((notification) => !notification.isRead);

  const loadNotifications = async () => {
    if (!isLoggedIn) {
      setNotifications([]);
      setNotificationsError('');
      return;
    }

    setNotificationsLoading(true);
    setNotificationsError('');

    try {
      const result = await getMyNotifications(authSession?.accessToken || '');
      setNotifications(Array.isArray(result) ? result : []);
    } catch (error) {
      setNotifications([]);
      setNotificationsError(error instanceof Error ? error.message : 'Unable to load notifications.');
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleClearAllNotifications = async () => {
    if (!isLoggedIn) {
      return;
    }

    setNotificationsError('');

    try {
      await markAllNotificationsAsRead(authSession?.accessToken || '');
      await loadNotifications();
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : 'Unable to clear notifications.');
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      setIsUserMenuOpen(false);
      setIsNotificationsOpen(false);
      setNotifications([]);
      setNotificationsError('');
      return undefined;
    }

    loadNotifications();

    const handleDocumentClick = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }

      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLoggedIn]);

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    setIsNotificationsOpen(false);
    if (onLogout) {
      onLogout();
      return;
    }

    clearAuthSession();
    window.location.reload();
  };

  const handleDashboard = () => {
    setIsUserMenuOpen(false);

    if (currentUser?.role === 'ADMIN') {
      onOpenDashboard?.();
      return;
    }

    if (currentUser?.role === 'TECHNICIAN') {
      onOpenTechnicianDashboard?.();
      return;
    }

    onOpenBookings?.();
  };

  const HomeControl = isHomePage ? (
    <span aria-current="page" className="nav-link nav-link--active">
      Home
    </span>
  ) : onHome ? (
    <button className="nav-link nav-link--button" type="button" onClick={onHome}>
      Home
    </button>
  ) : (
    <a className="nav-link" href="#home">
      Home
    </a>
  );

  const AboutUsControl = isAboutPage ? (
    <span aria-current="page" className="nav-link nav-link--active">
      About Us
    </span>
  ) : onOpenAbout ? (
    <button className="nav-link nav-link--button" type="button" onClick={onOpenAbout}>
      About Us
    </button>
  ) : (
    <a className="nav-link" href="#about">
      About Us
    </a>
  );

  const TicketsControl = onOpenTickets ? (
    <button className="nav-link nav-link--button" type="button" onClick={onOpenTickets}>
      Tickets
    </button>
  ) : (
    <a className="nav-link" href="#tickets">
      Tickets
    </a>
  );

  const ResourcesControl = onOpenResources ? (
    <button className="nav-link nav-link--button" type="button" onClick={onOpenResources}>
      Resources
    </button>
  ) : (
    <a className="nav-link" href="#resources">
      Resources
    </a>
  );

  return (
    <header className={[ 'landing-nav', className ].filter(Boolean).join(' ')}>
      <div className="brand">
        <div className="brand__title">UniCore</div>
      </div>

      <nav aria-label="Primary" className="nav-links">
        {HomeControl}
        {AboutUsControl}
        {TicketsControl}
        {ResourcesControl}
        <a className="nav-link" href="#faq">
          FAQ
        </a>
      </nav>

      <div className="nav-actions">
        {isLoggedIn ? (
          <>
            <div className="landing-user-menu landing-user-menu--notifications" ref={notificationsRef}>
              <button
                aria-expanded={isNotificationsOpen}
                aria-haspopup="menu"
                aria-label={`Notifications${unreadNotifications.length ? ` (${unreadNotifications.length} unread)` : ''}`}
                className="landing-user-chip landing-user-chip--button landing-notification-bell relative"
                type="button"
                onClick={() => {
                  setIsNotificationsOpen((currentValue) => !currentValue);
                  if (!isNotificationsOpen) {
                    loadNotifications();
                  }
                }}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  notifications
                </span>
                {unreadNotifications.length > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F17620] px-1 text-[10px] font-bold text-white shadow">
                    {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
                  </span>
                ) : null}
              </button>

              {isNotificationsOpen ? (
                <div className="landing-user-menu__dropdown landing-user-menu__dropdown--notifications w-96 max-w-[calc(100vw-2rem)]" role="menu" aria-label="Notifications">
                  <div className="border-b border-[#272269]/10 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#272269]">Notifications</p>
                        <p className="mt-1 text-xs text-[#272269]/60">
                          {notificationsLoading
                            ? 'Loading notifications...'
                            : `${unreadNotifications.length} unread notification${unreadNotifications.length === 1 ? '' : 's'}`}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="rounded-full border border-[#272269]/10 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#272269]/60 transition hover:border-[#F17620]/30 hover:text-[#F17620] disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={handleClearAllNotifications}
                        disabled={notificationsLoading || notifications.length === 0}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notificationsError ? (
                      <div className="px-4 py-3 text-sm text-red-700">{notificationsError}</div>
                    ) : notificationsLoading ? (
                      <div className="px-4 py-6 text-sm text-[#272269]/60">Loading notifications...</div>
                    ) : unreadNotifications.length > 0 ? (
                      unreadNotifications.map((notification) => (
                        <div key={notification.id} className="border-b border-[#272269]/5 px-4 py-3 last:border-b-0">
                          <p className="text-sm font-semibold text-[#272269]">{notification.title || 'Notification'}</p>
                          <p className="mt-1 text-xs leading-5 text-[#272269]/70">{notification.message}</p>
                          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#272269]/35">
                            {notification.type || 'NOTIFICATION'}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-sm text-[#272269]/60">No unread notifications yet.</div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="landing-user-menu" ref={userMenuRef}>
              <button
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
                className="landing-user-chip landing-user-chip--button"
                type="button"
                onClick={() => setIsUserMenuOpen((currentValue) => !currentValue)}
              >
                <span className="landing-user-chip__name">
                  {getFullName(currentUser)}
                </span>
                <span className="landing-user-chip__role">{currentUser.role}</span>
              </button>

              {isUserMenuOpen ? (
                <div className="landing-user-menu__dropdown" role="menu" aria-label="User menu">
                  {currentUser.role === 'ADMIN' || currentUser.role === 'TECHNICIAN' || onOpenBookings ? (
                    <button className="landing-user-menu__item" type="button" role="menuitem" onClick={handleDashboard}>
                      Dashboard
                    </button>
                  ) : null}
                  <button className="landing-user-menu__item landing-user-menu__item--danger" type="button" onClick={handleLogout} role="menuitem">
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <button className="nav-text-button" type="button" onClick={onLogin}>
              Login
            </button>
            <button className="uc-button uc-button--primary uc-button--small" type="button" onClick={onSignup}>
              Sign Up
            </button>
          </>
        )}
      </div>
    </header>
  );
}