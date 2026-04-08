import './App.css';
import './styles/uniCore.css';
import { useState } from 'react';
import { clearAuthSession } from './api/authApi';
import LandingView from './views/landing/LandingView.jsx';
import LoginView from './views/auth/LoginView.jsx';
import SignupView from './views/auth/SignupView.jsx';
import AdminDashboardView from './views/dashboard/AdminDashboardView.jsx';
import UserDashboard from './views/booking/UserDashboard';
import BookingFormPage from './views/booking/BookingFormPage.jsx';

function App() {
  const [activeView, setActiveView]           = useState('adminDashboard');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState(null);

  const showLanding   = () => setActiveView('landing');
  const showLogin     = () => setActiveView('login');
  const showSignup    = () => setActiveView('signup');
  const showDashboard = () => setActiveView('adminDashboard');
  const showBookings  = () => setActiveView('bookings');

  const openBookingForm  = (resourceId) => { setSelectedResourceId(resourceId); setShowBookingForm(true); };
  const closeBookingForm = () => { setShowBookingForm(false); setSelectedResourceId(null); };

  const handleAuthenticated = () => {
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
      ) : activeView === 'signup' ? (
        <SignupView onBack={showLanding} onSwitchToLogin={showLogin} />
      ) : activeView === 'adminDashboard' ? (
        <AdminDashboardView onHome={showLanding} onLogout={handleLogout} onOpenDashboard={showDashboard} />
      ) : activeView === 'bookings' ? (
        <UserDashboard />
      ) : (
        <LandingView onLogin={showLogin} onSignup={showSignup} onOpenDashboard={showDashboard} onLogout={handleLogout} onOpenBookings={showBookings} />
      )}

      {/* Booking form modal — rendered on top of any view */}
      {showBookingForm && (
        <BookingFormPage
          resourceId={selectedResourceId}
          onClose={closeBookingForm}
          onSuccess={closeBookingForm}
        />
      )}

      {/* Temporary test button — remove once resource page is ready */}
      <button
        onClick={() => openBookingForm(1)}
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 500,
          background: '#F57923', color: '#fff',
          border: 'none', borderRadius: '999px',
          padding: '12px 20px',
          fontSize: '13px', fontWeight: 700, fontFamily: 'Inter, sans-serif',
          boxShadow: '0 4px 16px rgba(245,121,35,0.4)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
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
