import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { TicketsHubPage, TicketsOverview } from './pages/TicketsHubPage';
import { CreateTicketPage } from './pages/CreateTicketPage';
import { MyTicketsPage } from './pages/MyTicketsPage';
import { TicketDetailPage } from './pages/TicketDetailPage';
import LandingView from './views/landing/LandingView';
import LoginView from './views/auth/LoginView';
import SignupView from './views/auth/SignupView';
import AdminDashboardView from './views/dashboard/AdminDashboardView';
import TechnicianDashboardView from './views/dashboard/TechnicianDashboardView';
import { clearAuthSession, getAuthSession } from './api/authApi';
import './styles/uniCore.css';

function LandingRoute() {
  const navigate = useNavigate();
  const openDashboardByRole = () => {
    const role = getAuthSession()?.user?.role;
    if (role === 'ADMIN') {
      navigate('/admin-dashboard');
      return;
    }
    if (role === 'TECHNICIAN') {
      navigate('/technician-dashboard');
    }
  };

  return (
    <LandingView
      onHome={() => navigate('/')}
      onTickets={() => navigate('/tickets')}
      onLogin={() => navigate('/login')}
      onSignup={() => navigate('/signup')}
      onOpenDashboard={openDashboardByRole}
      onLogout={() => {
        clearAuthSession();
        navigate('/');
      }}
    />
  );
}

function LoginRoute() {
  const navigate = useNavigate();
  return (
    <LoginView
      onBack={() => navigate('/')}
      onSwitchToSignup={() => navigate('/signup')}
      onAuthenticated={(authResponse) => {
        const role = authResponse?.user?.role;
        if (role === 'TECHNICIAN') {
          navigate('/technician-dashboard');
          return;
        }
        if (role === 'ADMIN') {
          navigate('/admin-dashboard');
          return;
        }
        navigate('/');
      }}
    />
  );
}

function SignupRoute() {
  const navigate = useNavigate();
  return (
    <SignupView
      onBack={() => navigate('/')}
      onSwitchToLogin={() => navigate('/login')}
    />
  );
}

function Layout({ children }) {
  const { pathname } = useLocation();
  if (pathname === '/' || pathname === '/admin-dashboard' || pathname === '/technician-dashboard') {
    return <>{children}</>;
  }
  const ticketSectionActive = pathname.startsWith('/tickets');

  return (
    <div className="min-h-screen bg-campus-bg">
      <header className="sticky top-0 z-50 border-b border-indigo-200/60 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="text-lg font-bold tracking-tight text-slate-800">
            Smart Campus
          </Link>
          <Link
            to="/tickets"
            className={[
              'inline-flex items-center rounded-full px-5 py-2 text-sm font-bold shadow-md transition-colors',
              ticketSectionActive
                ? 'bg-campus-primary text-white ring-2 ring-campus-primary ring-offset-2'
                : 'bg-campus-primary text-white hover:bg-campus-primary-hover',
            ].join(' ')}
          >
            Tickets
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  const handleLogout = () => {
    clearAuthSession();
    navigate('/');
  };
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/signup" element={<SignupRoute />} />
        <Route path="/admin-dashboard" element={<AdminDashboardView onHome={() => navigate('/')} onLogout={handleLogout} />} />
        <Route
          path="/technician-dashboard"
          element={<TechnicianDashboardView onHome={() => navigate('/')} onLogout={handleLogout} />}
        />
        <Route path="/tickets" element={<TicketsHubPage />}>
          <Route index element={<TicketsOverview />} />
          <Route path="new" element={<CreateTicketPage />} />
          <Route path="mine" element={<MyTicketsPage />} />
          <Route path=":id" element={<TicketDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
