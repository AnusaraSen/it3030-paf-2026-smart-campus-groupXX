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
  const [selectedResource, setSelectedResource] = useState(null);

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

  const openBookingForm = (resource) => {
    setSelectedResource(resource);
    setShowBookingForm(true);
  };

  const closeBookingForm = () => {
    setShowBookingForm(false);
    setSelectedResource(null);
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
          onOpenBookingForm={openBookingForm}
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
          resource={selectedResource}
          onClose={closeBookingForm}
          onSuccess={closeBookingForm}
        />
      )}
    </div>
  );
}

export default App;
