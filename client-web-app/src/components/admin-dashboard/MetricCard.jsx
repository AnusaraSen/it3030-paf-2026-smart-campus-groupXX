import React from 'react';

export default function MetricCard({ icon, title, value, accentClassName = 'bg-[#272269]/5 text-[#272269]', trend }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/50 bg-white/70 p-6 shadow-sm backdrop-blur-2xl transition-all duration-500 hover:bg-white/90">
      <div className="mb-4 flex items-start justify-between">
        <div className={`rounded-2xl p-3 ${accentClassName}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            {icon}
          </span>
        </div>
        {trend ? (
          <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-600">
            <span className="material-symbols-outlined text-[12px]">trending_up</span>
            {trend}
          </span>
        ) : null}
      </div>
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#272269]/50">{title}</p>
      <h3 className="font-headline text-3xl font-black tracking-tight text-[#272269]">{value}</h3>
    </div>
  );
}