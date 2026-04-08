import React from 'react';
import SiteHeader from '../shared/SiteHeader.jsx';

export default function AdminDashboardHeader({ onHome, onOpenDashboard, onLogout }) {
  return <SiteHeader className="landing-nav--dashboard" onHome={onHome} onOpenDashboard={onOpenDashboard} onLogout={onLogout} />;
}