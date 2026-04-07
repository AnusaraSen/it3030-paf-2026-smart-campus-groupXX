import React, { useEffect, useRef, useState } from 'react';
import { clearAuthSession, getAuthSession } from '../../api/authApi';

const featureCards = [
  {
    icon: 'event_seat',
    title: 'Resource Booking',
    copy: 'Seamless allocation of campus assets and spaces, from lecture halls to specialized lab equipment.',
  },
  {
    icon: 'report_problem',
    title: 'Incident Management',
    copy: 'Real-time tracking and resolution of campus safety, maintenance requests, and IT disruptions.',
  },
  {
    icon: 'domain',
    title: 'Facility & Asset Management',
    copy: 'Intelligent oversight of infrastructure, lifecycle tracking, and predictive maintenance scheduling.',
  },
  {
    icon: 'query_stats',
    title: 'Analytical Dashboard',
    copy: 'High-fidelity data visualization for informed operational decisions and strategic campus planning.',
  },
];

const campusImageUrl =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBTmCu8_MCWlAFSe7u3fXg8BjbJ0OgQ3E_vVy1--tswxDkqjhvUPGRoNYQrydbwK8YeKYDRpiBsVF2GGYqPFtHGkFYVz0uRbvYYlfXRFdoV1RieEEMDFxurQ1WipXWg02hx3wdDXOeEoeEID0VW1YWvl8y-ggej0-QB2nWpvNszdNkWgKlPoODvtp3FhhqpWnCcChFBmGUU9qHgNhJU21i4LRe7nm3liD9p6kVFkZ6tj9HP2AfCdt_YPgMxiUDQEveVQV1Lk5XNIR8';

export default function LandingView({ onLogin, onSignup }) {
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

  const scrollToFeatures = () => {
    const element = document.getElementById('features');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setIsUserMenuOpen(false);
    window.location.reload();
  };

  return (
    <div className="uc-shell landing-screen">
      <header className="landing-nav">
        <div className="brand">
          <div className="brand__title">UniCore</div>
        </div>

        <nav aria-label="Primary" className="nav-links">
          <a className="nav-link nav-link--active" href="#home">
            Home
          </a>
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
                  {currentUser.firstName} {currentUser.lastName}
                </span>
                <span className="landing-user-chip__role">{currentUser.role}</span>
              </button>

              {isUserMenuOpen ? (
                <div className="landing-user-menu__dropdown" role="menu" aria-label="User menu">
                  <a className="landing-user-menu__item" href="#dashboard" role="menuitem" onClick={() => setIsUserMenuOpen(false)}>
                    Dashboard
                  </a>
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

      <main className="landing-main" id="home">
        <section className="hero-section">
          <span aria-hidden="true" className="landing-glow landing-glow--left" />
          <span aria-hidden="true" className="landing-glow landing-glow--right" />

          <div className="hero-copy-block">
            <div className="badge badge--reference">
              <span aria-hidden="true" className="pulse-dot" />
              Live Campus Operations
            </div>

            <h1 className="hero-title hero-title--reference">
              Orchestrating <span className="hero-title__accent">Academic Excellence</span> through Precision Operations
            </h1>

            <p className="hero-copy hero-copy--reference">
              The centralized command center for smart campus workflows. Enhance efficiency,
              resource management, and facility intelligence from a single, trusted workspace.
            </p>

            <div className="hero-actions hero-actions--reference">
              <button className="uc-button uc-button--primary" type="button" onClick={onSignup}>
                Get Started
              </button>
              <button className="uc-button uc-button--secondary" type="button" onClick={scrollToFeatures}>
                Explore Features
              </button>
            </div>
          </div>

          <div className="hero-media">
            <div className="hero-image-card">
              <img
                alt="Modern University Campus Architecture"
                className="hero-image"
                src={campusImageUrl}
              />
            </div>

            <article className="kpi-card kpi-card--top">
              <div className="kpi-card__header">
                <span className="material-symbols-outlined kpi-card__icon">hub</span>
                <span className="kpi-card__label">Active Assets</span>
              </div>
              <div className="kpi-card__value">1,284</div>
              <div className="kpi-bar">
                <span className="kpi-bar__fill kpi-bar__fill--primary" />
              </div>
            </article>

            <article className="kpi-card kpi-card--bottom">
              <div className="kpi-card__header">
                <span className="material-symbols-outlined kpi-card__icon">speed</span>
                <span className="kpi-card__label">System Health</span>
              </div>
              <div className="kpi-card__value">99.98%</div>
              <div className="kpi-card__caption">
                <span className="material-symbols-outlined">trending_up</span>
                Optimal Performance
              </div>
            </article>
          </div>
        </section>

        <section className="features-section" id="features">
          <div className="section-heading section-heading--reference">
            <h2 className="section-title section-title--reference">Core Capabilities of UniCore</h2>
            <p className="section-subtitle section-subtitle--reference">
              Integrated tools designed for the unique complexities of modern university infrastructure
              and student-centered operations.
            </p>
          </div>

          <div className="feature-grid feature-grid--reference">
            {featureCards.map((card) => (
              <article className="feature-card feature-card--reference" key={card.title}>
                <div className="feature-card__icon feature-card__icon--reference">
                  <span className="material-symbols-outlined">{card.icon}</span>
                </div>
                <h3 className="feature-card__title feature-card__title--reference">{card.title}</h3>
                <p className="feature-card__copy feature-card__copy--reference">{card.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="cta-section">
          <div className="cta-panel cta-panel--reference">
            <h2 className="section-title section-title--reference cta-title">
              Power your campus with smarter operations and seamless management
            </h2>
            <p className="section-subtitle section-subtitle--reference cta-copy">
              Join 50+ leading institutions that have transformed their operational efficiency with UniCore.
            </p>
            <button className="uc-button uc-button--primary uc-button--large" type="button" onClick={onSignup}>
              Get Started Today
            </button>
          </div>
        </section>
      </main>

      <footer className="footer footer--reference">
        <div className="footer-grid">
          <div className="footer-brand-block">
            <div className="footer-brand">UniCore</div>
            <p className="footer-copy-block">
              Setting the gold standard for integrated campus operational intelligence and resource coordination.
            </p>
          </div>

          <div className="footer-column">
            <h4>Platform</h4>
            <nav>
              <a href="#about">About UniCore</a>
              <a href="#dashboard">Dashboard</a>
              <a href="#bookings">Bookings</a>
            </nav>
          </div>

          <div className="footer-column">
            <h4>Support</h4>
            <nav>
              <a href="#tickets">Tickets</a>
              <a href="#faq">FAQ</a>
              <a href="#contact">Contact Info</a>
            </nav>
          </div>

          <div className="footer-column">
            <h4>Connectivity</h4>
            <div className="footer-icons">
              <a aria-label="Website" href="#web">
                <span className="material-symbols-outlined">language</span>
              </a>
              <a aria-label="Share" href="#share">
                <span className="material-symbols-outlined">share</span>
              </a>
            </div>
          </div>
        </div>

        <div className="footer__bar footer__bar--reference">
          <p className="footer__copy">© 2024 UniCore Smart Campus Operations Hub. All rights reserved.</p>
          <div className="footer__links">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
