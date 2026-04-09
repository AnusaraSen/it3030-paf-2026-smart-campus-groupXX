import './App.css';
import './styles/uniCore.css';
import { useEffect, useState } from 'react';
import { clearAuthSession } from './api/authApi';
import LandingView from './views/landing/LandingView.jsx';
import LoginView from './views/auth/LoginView.jsx';
import OAuthSuccessView from './views/auth/OAuthSuccessView.jsx';
import SignupView from './views/auth/SignupView.jsx';
import AdminDashboardView from './views/dashboard/AdminDashboardView.jsx';
import UserDashboard from './views/booking/UserDashboard';
import FacilitiesCatalogueView from './views/facility/FacilitiesCatalogueView.jsx';
import BookingFormPage from './views/booking/BookingFormPage.jsx';

function viewFromPath(pathname) {
  switch (pathname) {
    case '/admin':
      return 'login';
    case '/admin/dashboard':
      return 'adminDashboard';
    case '/login':
      return 'login';
    case '/signup':
      return 'signup';
    case '/oauth-success':
      return 'oauth-success';
    case '/bookings':
      return 'bookings';
    case '/resources':
      return 'resources';
    case '/':
    default:
      return 'landing';
  }
}

function App() {
  const [activeView, setActiveView] = useState(() => viewFromPath(window.location.pathname));
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState(null);

  useEffect(() => {
    const handlePopState = () => {
      setActiveView(viewFromPath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const go = (path, view) => {
    window.history.pushState({}, '', path);
    setActiveView(view);
  };

  const showLanding = () => go('/', 'landing');
  const showLogin = () => go('/login', 'login');
  const showSignup = () => go('/signup', 'signup');
  const showDashboard = () => go('/admin/dashboard', 'adminDashboard');
  const showBookings = () => go('/bookings', 'bookings');
  const showResources = () => go('/resources', 'resources');

  const openBookingForm = (resourceId) => {
    setSelectedResourceId(resourceId);
    setShowBookingForm(true);
  };

  const closeBookingForm = () => {
    setShowBookingForm(false);
    setSelectedResourceId(null);
  };

  const handleAuthenticated = (authResponse) => {
    const role = authResponse?.user?.role;
    if (role === 'ADMIN') {
      showDashboard();
      return;
    }

    showLanding();
  };

  const handleLogout = () => {
    clearAuthSession();
    showLanding();
  };

  return (
    <div className="app-root">
      {activeView === 'login' ? (
        <LoginView onAuthenticated={handleAuthenticated} onBack={showLanding} onSwitchToSignup={showSignup} />
      ) : activeView === 'oauth-success' ? (
        <OAuthSuccessView onAuthenticated={handleAuthenticated} onBackToLogin={showLogin} />
      ) : activeView === 'signup' ? (
        <SignupView onBack={showLanding} onSwitchToLogin={showLogin} />
      ) : activeView === 'adminDashboard' ? (
        <AdminDashboardView
          onHome={showLanding}
          onLogout={handleLogout}
          onOpenDashboard={showDashboard}
          onOpenBookings={showBookings}
          onOpenResources={showResources}
        />
      ) : activeView === 'bookings' ? (
        <UserDashboard onHome={showLanding} onLogout={handleLogout} />
      ) : activeView === 'resources' ? (
        <FacilitiesCatalogueView
          onHome={showLanding}
          onLogout={handleLogout}
          onOpenDashboard={showDashboard}
          onOpenBookings={showBookings}
          onOpenResources={showResources}
        />
      ) : (
        <LandingView
          onLogin={showLogin}
          onSignup={showSignup}
          onOpenDashboard={showDashboard}
          onLogout={handleLogout}
          onOpenBookings={showBookings}
          onOpenResources={showResources}
        />
      )}

      {showBookingForm && (
        <BookingFormPage
          resourceId={selectedResourceId}
          onClose={closeBookingForm}
          onSuccess={closeBookingForm}
        />
      )}

      <button
        onClick={() => openBookingForm(1)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 500,
          background: '#F57923',
          color: '#fff',
          border: 'none',
          borderRadius: '999px',
          padding: '12px 20px',
          fontSize: '13px',
          fontWeight: 700,
          fontFamily: 'Inter, sans-serif',
          boxShadow: '0 4px 16px rgba(245,121,35,0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>
          calendar_add_on
        </span>
        Test Booking Form
      </button>
    </div>
  );
}

export default App;
