import React from 'react';

const users = [
  { name: 'Dr. Julian Vance', role: 'ADMIN', status: 'Active', department: 'System Administration' },
  { name: 'Kasun Hewawitharana', role: 'USERS', status: 'Active', department: 'Operations' },
  { name: 'Mia Fernando', role: 'TECHNICIAN', status: 'Pending', department: 'Infrastructure' },
  { name: 'Nadika Perera', role: 'USERS', status: 'Active', department: 'Faculty Support' },
];

export default function UserManagementPanel() {
  return (
    <section className="glass-panel rounded-3xl border border-white/50 p-8 shadow-sm" id="user-management">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="mb-3 inline-block rounded-full border border-[#F17620]/20 bg-[#F17620]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F17620]">
            User Management
          </span>
          <h4 className="font-headline text-2xl font-black text-[#272269]">Manage campus access and roles</h4>
          <p className="mt-2 max-w-2xl text-sm text-[#272269]/70">
            Review active users, validate account status, and keep administrative roles aligned with campus operations.
          </p>
        </div>

        <button className="uc-button uc-button--primary uc-button--small self-start md:self-auto" type="button">
          Add User
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white/60">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#272269]/40">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {users.map((user) => (
              <tr key={user.name} className="border-t border-white/60 transition-colors hover:bg-[#272269]/5">
                <td className="px-6 py-4 font-medium text-[#272269]">{user.name}</td>
                <td className="px-6 py-4 text-[#272269]/70">{user.role}</td>
                <td className="px-6 py-4 text-[#272269]/70">{user.department}</td>
                <td className="px-6 py-4">
                  <span
                    className={[
                      'rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest',
                      user.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-[#F17620]/10 text-[#F17620]',
                    ].join(' ')}
                  >
                    {user.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}