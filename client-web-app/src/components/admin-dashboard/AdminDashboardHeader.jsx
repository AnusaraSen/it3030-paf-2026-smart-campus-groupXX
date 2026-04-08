import React from 'react';
import SiteHeader from '../shared/SiteHeader.jsx';

export default function AdminDashboardHeader({ onHome, onOpenDashboard, onOpenBookings, onOpenResources, onLogout }) {
  return (
    <SiteHeader
      className="landing-nav--dashboard"
      onHome={onHome}
      onOpenDashboard={onOpenDashboard}
      onOpenBookings={onOpenBookings}
      onOpenResources={onOpenResources}
      onLogout={onLogout}
    />
  );
}