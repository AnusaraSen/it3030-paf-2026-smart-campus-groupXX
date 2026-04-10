import { useCallback, useEffect, useState } from 'react';
import { clearAuthSession, getAuthSession } from './api/authApi';
import './styles/uniCore.css';
import LandingView from './views/landing/LandingView.jsx';
import AboutView from './views/about/AboutView.jsx';
import LoginView from './views/auth/LoginView.jsx';
import OAuthSuccessView from './views/auth/OAuthSuccessView.jsx';
import SignupView from './views/auth/SignupView.jsx';
import { AuthProvider } from './auth/AuthContext';
import AdminDashboardView from './views/dashboard/AdminDashboardView.jsx';
import TechnicianDashboardView from './views/dashboard/TechnicianDashboardView.jsx';
import UserDashboard from './views/booking/UserDashboard';
import FacilitiesCatalogueView from './views/facility/FacilitiesCatalogueView.jsx';
import BookingFormPage from './views/booking/BookingFormPage.jsx';
import TicketsHubPage from './pages/TicketsHubPage.js';
import CreateTicketPage from './pages/CreateTicketPage.js';

function viewFromPath(pathname) {
  switch (pathname) {
    case '/admin':
      return 'login';
    case '/admin/dashboard':
      return 'adminDashboard';
    case '/technician/dashboard':
      return 'technicianDashboard';
    case '/login':
      return 'login';
    case '/signup':
      return 'signup';
    case '/oauth-success':
      return 'oauth-success';
    case '/about':
      return 'about';
    case '/bookings':
      return 'bookings';
    case '/resources':
      return 'resources';
    case '/tickets':
    case '/tickets/new':
      return 'tickets';
    case '/':
    default:
      return 'landing';
  }
}

function App() {
  const [activeView, setActiveView] = useState(() => viewFromPath(window.location.pathname));
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [showTicketForm, setShowTicketForm] = useState(window.location.pathname === '/tickets/new');
  const [selectedTicketResource, setSelectedTicketResource] = useState(null);
  const authSession = getAuthSession();
  const isLoggedIn = Boolean(authSession?.accessToken && authSession?.user);

  useEffect(() => {
    const handlePopState = () => {
      const nextPath = window.location.pathname;
      setActiveView(viewFromPath(nextPath));
      setShowTicketForm(nextPath === '/tickets/new');

      if (nextPath !== '/tickets/new') {
        setSelectedTicketResource(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const go = useCallback((path, view) => {
    window.history.pushState({}, '', path);
    setActiveView(view);

    if (path === '/tickets/new') {
      setShowTicketForm(true);
      return;
    }

    setShowTicketForm(false);
    setSelectedTicketResource(null);
  }, []);

  const showLanding = useCallback(() => go('/', 'landing'), [go]);
  const showLogin = useCallback(() => go('/login', 'login'), [go]);
  const showSignup = useCallback(() => go('/signup', 'signup'), [go]);
  const showAbout = useCallback(() => go('/about', 'about'), [go]);
  const showDashboard = useCallback(() => go('/admin/dashboard', 'adminDashboard'), [go]);
  const showTechnicianDashboard = useCallback(() => go('/technician/dashboard', 'technicianDashboard'), [go]);
  const showBookings = useCallback(() => go('/bookings', 'bookings'), [go]);
  const showResources = () => {
    if (!isLoggedIn) {
      showLogin();
      return;
    }

    go('/resources', 'resources');
  };
  const showTickets = useCallback(() => {
    if (!isLoggedIn) {
      showLogin();
      return;
    }

    setSelectedTicketResource(null);
    setShowTicketForm(false);
    go('/tickets', 'tickets');
  }, [go, isLoggedIn, showLogin]);

  useEffect(() => {
    if (!isLoggedIn && (activeView === 'tickets' || activeView === 'resources')) {
      showLogin();
    }
  }, [activeView, isLoggedIn, showLogin]);

  const openBookingForm = (resource) => {
    setSelectedResource(resource);
    setShowBookingForm(true);
  };

  const closeBookingForm = () => {
    setShowBookingForm(false);
    setSelectedResource(null);
  };

  const openTicketForm = (resource) => {
    setSelectedTicketResource(resource || null);
    setShowTicketForm(true);
    go('/tickets/new', 'tickets');
  };

  const closeTicketForm = () => {
    setShowTicketForm(false);
    setSelectedTicketResource(null);
    go('/tickets', 'tickets');
  };

  const handleAuthenticated = (authResponse) => {
    const role = authResponse?.user?.role;
    if (role === 'ADMIN') {
      showDashboard();
      return;
    }

    if (role === 'TECHNICIAN') {
      showTechnicianDashboard();
      return;
    }

    showLanding();
  };

  const handleLogout = () => {
    clearAuthSession();
    showLanding();
  };

  return (
    <AuthProvider>
      <div className="app-root">
        {activeView === 'login' ? (
          <LoginView onAuthenticated={handleAuthenticated} onBack={showLanding} onSwitchToSignup={showSignup} />
        ) : activeView === 'oauth-success' ? (
          <OAuthSuccessView onAuthenticated={handleAuthenticated} onBackToLogin={showLogin} />
        ) : activeView === 'signup' ? (
          <SignupView onBack={showLanding} onSwitchToLogin={showLogin} />
        ) : activeView === 'about' ? (
          <AboutView
            onHome={showLanding}
            onLogin={showLogin}
            onSignup={showSignup}
            onOpenAbout={showAbout}
            onOpenDashboard={showDashboard}
            onOpenTechnicianDashboard={showTechnicianDashboard}
            onOpenBookings={showBookings}
            onOpenTickets={showTickets}
            onOpenResources={showResources}
            onLogout={handleLogout}
            isHomePage={false}
            isAboutPage
          />
        ) : activeView === 'adminDashboard' ? (
          <AdminDashboardView
            onHome={showLanding}
            onLogout={handleLogout}
            onOpenDashboard={showDashboard}
            onOpenBookings={showBookings}
            onOpenTickets={showTickets}
            onOpenResources={showResources}
          />
        ) : activeView === 'technicianDashboard' ? (
          <TechnicianDashboardView
            onHome={showLanding}
            onLogout={handleLogout}
            onOpenTickets={showTickets}
            onOpenResources={showResources}
          />
        ) : activeView === 'bookings' ? (
          <UserDashboard onHome={showLanding} onLogout={handleLogout} onOpenTickets={showTickets} />
        ) : activeView === 'tickets' ? (
          <TicketsHubPage
            onHome={showLanding}
            onLogout={handleLogout}
            onOpenDashboard={showDashboard}
            onOpenTechnicianDashboard={showTechnicianDashboard}
            onOpenBookings={showBookings}
            onOpenTickets={showTickets}
            onOpenResources={showResources}
            onRaiseTicket={openTicketForm}
          />
        ) : activeView === 'resources' ? (
          <FacilitiesCatalogueView
            onHome={showLanding}
            onLogout={handleLogout}
            onOpenDashboard={showDashboard}
            onOpenTechnicianDashboard={showTechnicianDashboard}
            onOpenBookings={showBookings}
            onOpenTickets={showTickets}
            onOpenResources={showResources}
            onOpenBookingForm={openBookingForm}
          />
        ) : (
          <LandingView
            onLogin={showLogin}
            onSignup={showSignup}
            onOpenAbout={showAbout}
            onOpenDashboard={showDashboard}
            onOpenTechnicianDashboard={showTechnicianDashboard}
            onLogout={handleLogout}
            onOpenBookings={showBookings}
            onOpenTickets={showTickets}
            onOpenResources={showResources}
            isHomePage
            isAboutPage={false}
          />
        )}

        {showTicketForm && (
          <CreateTicketPage
            modal
            resource={selectedTicketResource}
            onClose={closeTicketForm}
            onSuccess={closeTicketForm}
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
    </AuthProvider>
  );
}
export default App;
