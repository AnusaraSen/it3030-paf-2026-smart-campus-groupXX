import './App.css';
import './styles/uniCore.css';
import { useState } from 'react';
import { clearAuthSession } from './api/authApi';
import LandingView from './views/landing/LandingView.jsx';
import LoginView from './views/auth/LoginView.jsx';
import OAuthSuccessView from './views/auth/OAuthSuccessView.jsx';
import SignupView from './views/auth/SignupView.jsx';
import AdminDashboardView from './views/dashboard/AdminDashboardView.jsx';

function App() {
  const [activeView, setActiveView] = useState(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/oauth-success') {
      return 'oauth-success';
    }

    return 'landing';
  });

  const showLanding = () => setActiveView('landing');
  const showLogin = () => setActiveView('login');
  const showSignup = () => setActiveView('signup');
  const showDashboard = () => setActiveView('dashboard');

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
      ) : activeView === 'oauth-success' ? (
        <OAuthSuccessView onAuthenticated={handleAuthenticated} onBackToLogin={showLogin} />
      ) : activeView === 'signup' ? (
        <SignupView onBack={showLanding} onSwitchToLogin={showLogin} />
      ) : activeView === 'dashboard' ? (
        <AdminDashboardView onHome={showLanding} onLogout={handleLogout} onOpenDashboard={showDashboard} />
      ) : (
        <LandingView onLogin={showLogin} onSignup={showSignup} onOpenDashboard={showDashboard} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
