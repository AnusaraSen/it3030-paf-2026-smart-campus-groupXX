import React from 'react';
import SiteHeader from '../../components/shared/SiteHeader.jsx';

const focusAreas = [
  {
    icon: 'fact_check',
    title: 'Mission',
    copy: 'Create a centralized system to handle campus operations with clearer ownership, faster coordination, and less friction for users.',
  },
  {
    icon: 'hub',
    title: 'Scope',
    copy: 'Bring bookings, incident handling, and operational requests into one campus workflow so teams can work from the same source of truth.',
  },
  {
    icon: 'trending_up',
    title: 'Impact',
    copy: 'Reduce manual follow-up, improve visibility across services, and support more consistent decision-making for campus operations.',
  },
];

const teamRoles = [
  {
    title: 'Coordination and Planning',
    copy: 'Aligns requirements, priorities, and delivery milestones for the platform.',
  },
  {
    title: 'Interface Design',
    copy: 'Shapes a clear user experience that keeps operations simple and legible.',
  },
  {
    title: 'Application Development',
    copy: 'Builds the core workflows and integrates the campus operations services.',
  },
  {
    title: 'Testing and Validation',
    copy: 'Checks the platform for stability, consistency, and release readiness.',
  },
];

const heroStats = [
  { label: 'Institution', value: 'SLIIT' },
  { label: 'Team Size', value: '4 Members' },
  { label: 'Project Goal', value: 'Centralized Campus Operations' },
];

export default function AboutView({
  onHome,
  onLogin,
  onSignup,
  onOpenAbout,
  onOpenDashboard,
  onOpenTechnicianDashboard,
  onOpenBookings,
  onOpenTickets,
  onOpenResources,
  onLogout,
  isHomePage = false,
  isAboutPage = true,
}) {
  return (
    <div className="uc-shell about-screen">
      <SiteHeader
        onHome={onHome}
        onOpenAbout={onOpenAbout}
        onLogin={onLogin}
        onSignup={onSignup}
        onOpenDashboard={onOpenDashboard}
        onOpenTechnicianDashboard={onOpenTechnicianDashboard}
        onOpenBookings={onOpenBookings}
        onOpenTickets={onOpenTickets}
        onOpenResources={onOpenResources}
        onLogout={onLogout}
        isHomePage={isHomePage}
        isAboutPage={isAboutPage}
      />

      <main className="about-main" id="about">
        <section className="about-hero">
          <span aria-hidden="true" className="landing-glow landing-glow--left" />
          <span aria-hidden="true" className="landing-glow landing-glow--right" />

          <div className="about-hero__content">
            <div className="badge badge--reference">
              <span aria-hidden="true" className="pulse-dot" />
              About UniCore
            </div>

            <h1 className="about-title">
              A focused campus platform built to centralize operational work
            </h1>

            <p className="about-copy">
              UniCore is developed by a 4-member team at SLIIT to create a centralized system to
              handle the campus operations. The platform is shaped around clarity, consistency, and
              a formal operating model that supports the day-to-day needs of a smart campus.
            </p>
          </div>

          <div className="about-hero__panel">
            <article className="about-frame">
              <div className="about-frame__eyebrow">Project Snapshot</div>
              <h2 className="about-frame__title">Designed for a more coordinated campus workflow</h2>
              <p className="about-frame__copy">
                The project focuses on consolidating operational tasks into one system so the team
                can manage requests, services, and activity with fewer gaps between departments.
              </p>

              <div className="about-stat-grid">
                {heroStats.map((stat) => (
                  <div className="about-stat" key={stat.label}>
                    <div className="about-stat__label">{stat.label}</div>
                    <div className="about-stat__value">{stat.value}</div>
                  </div>
                ))}
              </div>
            </article>

            <article className="about-note">
              <span className="material-symbols-outlined about-note__icon">groups</span>
              <div>
                <div className="about-note__title">Collaborative delivery</div>
                <div className="about-note__copy">
                  The work is structured across planning, design, implementation, and validation.
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="about-section about-section--soft">
          <div className="section-heading section-heading--reference">
            <h2 className="section-title section-title--reference">What the platform is built to do</h2>
            <p className="section-subtitle section-subtitle--reference">
              The design stays deliberately practical: give the campus one place to manage core
              operations without adding unnecessary visual noise.
            </p>
          </div>

          <div className="about-grid">
            {focusAreas.map((area) => (
              <article className="about-card" key={area.title}>
                <div className="about-card__icon">
                  <span className="material-symbols-outlined">{area.icon}</span>
                </div>
                <h3 className="about-card__title">{area.title}</h3>
                <p className="about-card__copy">{area.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section about-section--plain">
          <div className="section-heading section-heading--reference">
            <h2 className="section-title section-title--reference">Team structure</h2>
            <p className="section-subtitle section-subtitle--reference">
              A small team works best when responsibilities are explicit. The roles below reflect
              the way the project is organized.
            </p>
          </div>

          <div className="about-team-grid">
            {teamRoles.map((role) => (
              <article className="about-team-card" key={role.title}>
                <h3 className="about-team-card__title">{role.title}</h3>
                <p className="about-team-card__copy">{role.copy}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer footer--reference about-footer">
        <div className="footer-grid">
          <div className="footer-brand-block">
            <div className="footer-brand">UniCore</div>
            <p className="footer-copy-block">
              Setting the standard for integrated campus operational intelligence and resource
              coordination.
            </p>
          </div>

          <div className="footer-column">
            <h4>Platform</h4>
            <nav>
              <a href="/">Home</a>
              <a href="#dashboard">Dashboard</a>
              <a href="#resources">Resources</a>
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
