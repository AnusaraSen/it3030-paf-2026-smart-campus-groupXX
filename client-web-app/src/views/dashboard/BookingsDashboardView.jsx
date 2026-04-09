import React from 'react';
import { Link } from 'react-router-dom';
import AdminDashboardHeader from '../../components/admin-dashboard/AdminDashboardHeader.jsx';
import AdminDashboardFooter from '../../components/admin-dashboard/AdminDashboardFooter.jsx';

export default function BookingsDashboardView({ onHome, onLogout }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,#E0E7FF_0%,#faf9f9_100%)] px-5 pb-6 pt-8 text-[#272269]">
      <main className="relative mx-auto h-[calc(100vh-3rem)] max-w-7xl overflow-y-auto">
        <AdminDashboardHeader onHome={onHome} onLogout={onLogout} />

        <div className="space-y-8 px-4 pb-10 pt-16">
          <section className="glass-panel relative overflow-hidden rounded-3xl border border-white/50 p-10 shadow-xl shadow-[#272269]/5">
            <div className="absolute right-[-50px] top-[-50px] h-96 w-96 rounded-full bg-[#F17620] aura-glow" />
            <div className="absolute bottom-[-100px] left-[10%] h-64 w-64 rounded-full bg-[#272269] aura-glow" />
            <div className="relative z-10 flex flex-col items-end justify-between gap-8 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <span className="mb-4 inline-block rounded-full border border-[#F17620]/20 bg-[#F17620]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F17620]">
                  User Dashboard
                </span>
                <h2 className="mb-4 font-headline text-5xl font-extrabold leading-none tracking-tighter text-[#272269]">
                  My Bookings <br />
                  <span className="text-[#F17620]">& Ticket Dashboard</span>
                </h2>
                <p className="max-w-lg font-medium text-[#272269]/70">
                  View booking progress and move to ticket reporting when booking-related incidents occur.
                </p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/50">Booking Dashboard</p>
              <h3 className="mt-3 font-headline text-2xl font-black text-[#272269]">My Booking Summary</h3>
              <p className="mt-2 text-sm text-[#272269]/70">
                Your full booking metrics and approval flow will appear here after the bookings module merge.
              </p>
            </article>

            <article className="rounded-2xl border border-[#F17620]/20 bg-[#F17620]/5 p-6 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#F17620]">Ticket Dashboard</p>
              <h3 className="mt-3 font-headline text-2xl font-black text-[#272269]">Report Booking Incidents</h3>
              <p className="mt-2 text-sm text-[#272269]/70">
                If a booking is approved and there is an issue, open a maintenance or incident ticket from here.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link className="rounded-full bg-[#F17620] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#c85f10]" to="/tickets">
                  Open Tickets
                </Link>
                <Link className="rounded-full border border-[#272269]/20 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#272269]" to="/tickets/new">
                  Create Ticket
                </Link>
              </div>
            </article>
          </section>

          <AdminDashboardFooter />
        </div>
      </main>
    </div>
  );
}
