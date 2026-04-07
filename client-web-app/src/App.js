import './App.css';
import './styles/uniCore.css';
import { useState } from 'react';
import LandingView from './views/landing/LandingView.jsx';
import LoginView from './views/auth/LoginView.jsx';
import SignupView from './views/auth/SignupView.jsx';

function App() {
  const [activeView, setActiveView] = useState('landing');

  const showLanding = () => setActiveView('landing');
  const showLogin = () => setActiveView('login');
  const showSignup = () => setActiveView('signup');

  return (
    <div className="app-root">
      {activeView === 'login' ? (
        <LoginView onBack={showLanding} onSwitchToSignup={showSignup} />
      ) : activeView === 'signup' ? (
        <SignupView onBack={showLanding} onSwitchToLogin={showLogin} />
      ) : (
        <LandingView onLogin={showLogin} onSignup={showSignup} />
      )}
    </div>
  );
}

export default App;
