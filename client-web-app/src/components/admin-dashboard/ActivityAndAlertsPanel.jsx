import React from 'react';

const activityRows = [
  {
    action: 'Updated Timetable for Faculty of Science',
    admin: 'Sarah Miller',
    date: '2m ago',
    status: 'Applied',
    statusClassName: 'bg-emerald-100 text-emerald-600',
  },
  {
    action: 'New Admin Account Created',
    admin: 'System Root',
    date: '1h ago',
    status: 'Pending',
    statusClassName: 'bg-[#F17620]/10 text-[#F17620]',
  },
  {
    action: 'Backup Script Execution',
    admin: 'Auto-Daemon',
    date: '4h ago',
    status: 'Applied',
    statusClassName: 'bg-emerald-100 text-emerald-600',
  },
  {
    action: 'Infrastructure Scale-Up: Node 7',
    admin: 'Julian Vance',
    date: 'Yesterday',
    status: 'Verified',
    statusClassName: 'bg-[#272269]/10 text-[#272269]',
  },
];

const alerts = [
  {
    title: 'Database Latency Spike',
    meta: 'Region: US-East-1 | Impact: High',
    actionLabel: 'Troubleshoot',
    accentClassName: 'border-[#F17620] text-[#F17620] bg-white/60',
  },
  {
    title: 'Unauthorized Login Attempt',
    meta: 'IP: 192.168.1.104 | Locked',
    actionLabel: 'View Logs',
    accentClassName: 'border-[#272269]/20 text-[#272269]/60 bg-white/60',
  },
  {
    title: 'API Rate Limit Warning',
    meta: 'Service: Google Maps Integration',
    actionLabel: 'Settings',
    accentClassName: 'border-[#272269]/20 text-[#272269]/60 bg-white/60 opacity-60',
  },
];

export default function ActivityAndAlertsPanel() {
  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="glass-panel overflow-hidden rounded-3xl border border-white/50 shadow-sm lg:col-span-2">
        <div className="flex items-center justify-between border-b border-[#272269]/5 p-8">
          <h4 className="font-headline text-xl font-bold text-[#272269]">Recent Administrative Actions</h4>
          <span className="material-symbols-outlined cursor-pointer text-[#272269]/20 transition-colors hover:text-[#F17620]">more_horiz</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#272269]/40">
                <th className="px-8 py-4">Action</th>
                <th className="px-8 py-4">Admin</th>
                <th className="px-8 py-4">Date</th>
                <th className="px-8 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {activityRows.map((row) => (
                <tr key={row.action} className="group transition-colors hover:bg-[#272269]/5">
                  <td className="px-8 py-5 font-medium text-[#272269]">{row.action}</td>
                  <td className="px-8 py-5 text-[#272269]/70">{row.admin}</td>
                  <td className="px-8 py-5 text-[#272269]/40">{row.date}</td>
                  <td className="px-8 py-5">
                    <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${row.statusClassName}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-white/50 bg-gradient-to-b from-[#F17620]/5 to-transparent p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="material-symbols-outlined text-[#F17620]">warning</span>
          <h4 className="font-headline text-xl font-bold text-[#272269]">Critical Alerts</h4>
        </div>

        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.title} className={`relative rounded-2xl border-l-4 p-4 shadow-sm transition-transform hover:translate-x-1 ${alert.accentClassName}`}>
              <p className="mb-1 text-xs font-bold text-[#272269]">{alert.title}</p>
              <p className="mb-2 text-[10px] text-[#272269]/50">{alert.meta}</p>
              <button className="text-[10px] font-bold uppercase tracking-widest text-[#F17620] hover:underline" type="button">
                {alert.actionLabel}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-[#272269]/5 bg-[#272269]/5 p-6 text-center">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[#272269]/50">Maintenance Window</p>
          <p className="mb-1 text-sm font-bold text-[#272269]">Sunday, 04:00 AM</p>
          <p className="text-[10px] font-bold text-[#F17620]">Infrastructure Refactoring</p>
        </div>
      </div>
    </section>
  );
}