import React from 'react';
import AdminSidebar from '../admin-dashboard/AdminSidebar.jsx';

const userNavigationItems = [
  { icon: 'dashboard', label: 'Dashboard', key: 'dashboard' },
  { icon: 'person', label: 'User Information', key: 'user-information' },
  { icon: 'calendar_month', label: 'My Bookings', key: 'bookings' },
  { icon: 'confirmation_number', label: 'Tickets', key: 'tickets' },
  { icon: 'help', label: 'Support', key: 'support' },
];

export default function UserSidebar(props) {
  return <AdminSidebar {...props} navigationItems={userNavigationItems} />;
}