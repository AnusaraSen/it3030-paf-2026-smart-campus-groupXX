import React from 'react';
import SiteHeader from '../shared/SiteHeader.jsx';

export default function AdminDashboardHeader({
  onHome,
  onOpenDashboard,
  onOpenBookings,
  onOpenTickets,
  onOpenResources,
  onLogout,
  notificationTypePrefix,
  notificationTypePrefixes,
  notificationHeading,
}) {
  return (
    <SiteHeader
      className="landing-nav--dashboard"
      onHome={onHome}
      onOpenDashboard={onOpenDashboard}
      onOpenBookings={onOpenBookings}
      onOpenTickets={onOpenTickets}
      onOpenResources={onOpenResources}
      onLogout={onLogout}
      notificationTypePrefix={notificationTypePrefix}
      notificationTypePrefixes={notificationTypePrefixes}
      notificationHeading={notificationHeading}
    />
  );
}