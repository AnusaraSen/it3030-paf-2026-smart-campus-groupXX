import React from 'react';

export default function AdminDashboardFooter() {
  return (
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
  );
}