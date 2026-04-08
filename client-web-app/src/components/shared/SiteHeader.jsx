import React, { useEffect, useRef, useState } from 'react';
import { clearAuthSession, getAuthSession } from '../../api/authApi';

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
  onLogin,
  onSignup,
  onOpenDashboard,
  onOpenBookings,
  onLogout,
}) {
  const authSession = getAuthSession();
  const currentUser = authSession?.user || null;
  const isLoggedIn = Boolean(authSession?.accessToken && currentUser);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setIsUserMenuOpen(false);
      return undefined;
    }

    const handleDocumentClick = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
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

    onOpenBookings?.();
  };

  const HomeControl = onHome ? (
    <button className="nav-link nav-link--active nav-link--button" type="button" onClick={onHome}>
      Home
    </button>
  ) : (
    <a className="nav-link nav-link--active" href="#home">
      Home
    </a>
  );

  return (
    <header className={[ 'landing-nav', className ].filter(Boolean).join(' ')}>
      <div className="brand">
        <div className="brand__title">UniCore</div>
      </div>

      <nav aria-label="Primary" className="nav-links">
        {HomeControl}
        <a className="nav-link" href="#bookings">
          Bookings
        </a>
        <a className="nav-link" href="#tickets">
          Tickets
        </a>
        <a className="nav-link" href="#resources">
          Resources
        </a>
        <a className="nav-link" href="#faq">
          FAQ
        </a>
      </nav>

      <div className="nav-actions">
        {isLoggedIn ? (
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
                {currentUser.role === 'ADMIN' || onOpenBookings ? (
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