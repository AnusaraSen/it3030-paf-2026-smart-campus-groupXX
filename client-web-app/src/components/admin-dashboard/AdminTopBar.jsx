import React from 'react';

export default function AdminTopBar({ user, onHome, onLogout }) {
  return (
    <header className="sticky top-0 z-30 flex w-full items-center justify-between border-b border-[#272269]/5 bg-white/40 px-8 py-4 backdrop-blur-xl shadow-sm">
      <div className="flex items-center gap-8">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#272269]/40">search</span>
          <input
            className="w-80 rounded-xl border-none bg-[#272269]/5 py-2 pl-10 pr-4 text-sm font-body text-[#272269] placeholder:text-[#272269]/30 focus:ring-2 focus:ring-[#F17620]"
            placeholder="Global system search..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <button className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#272269]/50 transition-colors hover:bg-[#272269]/5" type="button">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#F17620]" />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-xl text-[#272269]/50 transition-colors hover:bg-[#272269]/5" type="button">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>

        <div className="h-8 w-px bg-[#272269]/10 mx-2" />

        <button
          className="rounded-lg border border-[#F17620]/30 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#F17620] transition-colors hover:bg-[#F17620]/10"
          type="button"
          onClick={onHome}
        >
          Home
        </button>

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right">
            <p className="font-headline text-xs font-bold text-[#272269]">{user.firstName} {user.lastName}</p>
            <p className="text-[10px] text-[#272269]/50">{user.role}</p>
          </div>
          <button className="h-10 w-10 overflow-hidden rounded-xl ring-2 ring-[#F17620]/20 shadow-sm" type="button" onClick={onLogout} title="Logout">
            <img
              alt="Administrator Profile"
              className="h-full w-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAY2aWMeCfottRrsjORX7HfdcHojvhT-YHyg4S0v9a8XyA-yACZ3mGhHl_H333OHVSHjQ9iULQBEaOPJLSIOf5W2DClQpXiU63LF1ZXtRylXgEGiek2B4PckaktkZzwYjMYoCfrYlunNJo2DZYC9NoMsEUWYcPI81dsJDNNk2jWmXocgb8ES_z9kju1mxAK-khv35wGNL-mqOF-ckAYe67OTvJF_zhz4OFFXu_q0rQOUU6AsPF0UbL6xpiHuLOFpSE2d5iG1jkMxek"
            />
          </button>
        </div>
      </div>
    </header>
  );
}