import React from 'react';

const navigationItems = [
  { icon: 'dashboard', label: 'Dashboard', active: true },
  { icon: 'group', label: 'User Management' },
];

export default function AdminSidebar({ onHome }) {
  return (
    <aside className="sticky top-28 flex h-[calc(100vh-7rem)] w-64 flex-col rounded-3xl border border-[#272269]/10 bg-white/40 py-6 shadow-xl backdrop-blur-2xl z-40">
      <div className="mb-10 px-8">
        <button type="button" onClick={onHome} className="flex items-center gap-3 text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#F17620] to-[#fe802a] shadow-lg">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
              school
            </span>
          </div>
          <div>
            <h1 className="font-headline text-xl font-black tracking-tighter text-[#272269]">UniCore</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#272269]/40">Operational Hub</p>
          </div>
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {navigationItems.map((item) => (
          <a
            key={item.label}
            className={[
              'flex items-center gap-4 px-4 py-3 text-sm font-body transition-all duration-300',
              item.active
                ? 'translate-x-1 border-l-4 border-[#F17620] bg-[#F17620]/5 font-bold text-[#272269]'
                : 'text-[#272269]/60 hover:bg-[#272269]/5 hover:text-[#272269] font-medium',
            ].join(' ')}
            href={`#${item.label.toLowerCase()}`}
          >
            <span
              className={[
                'material-symbols-outlined',
                item.active ? 'text-[#F17620]' : 'text-[#272269]/60',
              ].join(' ')}
              style={item.active ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="mt-auto px-6 pb-2" />
    </aside>
  );
}