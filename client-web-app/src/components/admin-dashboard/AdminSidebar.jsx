import React from 'react';

const navigationItems = [
  { icon: 'dashboard', label: 'Dashboard', key: 'dashboard' },
  { icon: 'calendar_month', label: 'Bookings', key: 'bookings' },
  { icon: 'group', label: 'User Management', key: 'user-management' },
];

export default function AdminSidebar({
  className = '',
  collapsed = false,
  activeSection = 'dashboard',
  navigationItems: customNavigationItems,
  onHome,
  onNavigateSection,
  onToggleCollapse,
}) {
  const items = customNavigationItems ?? navigationItems;

  return (
    <aside
      className={[
        'sticky top-28 flex h-[calc(100vh-7rem)] flex-col rounded-3xl border border-[#272269]/10 bg-white/40 py-6 shadow-xl backdrop-blur-2xl z-40 transition-all duration-300 overflow-hidden',
        className,
        collapsed ? 'w-20' : 'w-64',
      ].join(' ')}
    >
      <div className={collapsed ? 'mb-10 px-3' : 'mb-10 px-8'}>
        <button type="button" onClick={onHome} className={collapsed ? 'flex items-center justify-center' : 'flex items-center gap-3 text-left'}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#F17620] to-[#fe802a] shadow-lg">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
              school
            </span>
          </div>
          {collapsed ? null : (
            <div>
              <h1 className="font-headline text-xl font-black tracking-tighter text-[#272269]">UniCore</h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#272269]/40">Operational Hub</p>
            </div>
          )}
        </button>
      </div>

      <nav className={collapsed ? 'flex-1 space-y-1 px-2' : 'flex-1 space-y-1 px-4'}>
        {items.map((item) => (
          <button
            key={item.label}
            className={[
              'flex w-full items-center py-3 text-sm font-body transition-all duration-300 text-left',
              collapsed ? 'justify-center px-3' : 'gap-4 px-4',
              activeSection === item.key
                ? collapsed
                  ? 'rounded-2xl bg-[#F17620]/5 font-bold text-[#272269]'
                  : 'translate-x-1 border-l-4 border-[#F17620] bg-[#F17620]/5 font-bold text-[#272269]'
                : 'text-[#272269]/60 hover:bg-[#272269]/5 hover:text-[#272269] font-medium',
            ].join(' ')}
            type="button"
            onClick={() => onNavigateSection?.(item.key)}
          >
            <span
              className={[
                'material-symbols-outlined',
                activeSection === item.key ? 'text-[#F17620]' : 'text-[#272269]/60',
              ].join(' ')}
              style={activeSection === item.key ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            {collapsed ? <span className="sr-only">{item.label}</span> : <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="mt-auto flex items-center justify-between gap-3 px-4 pb-2">
        {collapsed ? <span className="sr-only">Collapse sidebar</span> : <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#272269]/30">Navigation</span>}
        <button
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#272269]/10 bg-white/60 text-[#272269] transition-colors hover:bg-white"
          type="button"
          onClick={onToggleCollapse}
        >
          <span className="material-symbols-outlined text-[20px]">{collapsed ? 'chevron_right' : 'chevron_left'}</span>
        </button>
      </div>
    </aside>
  );
}
