import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { HomePage } from './pages/HomePage';
import { TicketsHubPage, TicketsOverview } from './pages/TicketsHubPage';
import { CreateTicketPage } from './pages/CreateTicketPage';
import { MyTicketsPage } from './pages/MyTicketsPage';
import { TicketDetailPage } from './pages/TicketDetailPage';

function Layout({ children }) {
  const { pathname } = useLocation();
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
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
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
